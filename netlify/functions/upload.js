const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const os = require('os');

const prisma = new PrismaClient();

// Helper to handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Helper to parse request path
const getEndpoint = (event) => {
  const path = event.path.replace('/api/upload', '').replace('/.netlify/functions/upload', '');
  return path || '/';
};

// Helper to verify user token
const verifyUserToken = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.replace('Bearer ', '');
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Validate file type and size
const validateFile = (filename, fileSize, mimeType) => {
  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm',
    'audio/flac', 'audio/x-flac', 'video/mp4', 'video/webm',
    'video/quicktime'
  ];

  const maxSize = 500 * 1024 * 1024; // 500MB

  if (fileSize > maxSize) {
    throw new Error('File size exceeds 500MB limit');
  }

  if (!allowedTypes.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Please use audio or video files.`);
  }

  return true;
};

// Generate unique upload ID
const generateUploadId = () => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Parse multipart form data for file upload
const parseMultipartData = async (event) => {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Invalid content type for file upload');
  }

  // Extract boundary from content type
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    throw new Error('No boundary found in multipart data');
  }

  // Decode base64 body
  const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body);
  
  // Parse multipart data
  const parts = body.toString('binary').split(`--${boundary}`);
  const fields = {};
  let fileData = null;
  let fileName = null;
  let fileType = null;

  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data;')) {
      const lines = part.split('\r\n');
      const disposition = lines.find(line => line.includes('Content-Disposition'));
      
      if (disposition && disposition.includes('filename=')) {
        // This is a file part
        const nameMatch = disposition.match(/name="([^"]*)"/);
        const filenameMatch = disposition.match(/filename="([^"]*)"/);
        
        if (filenameMatch) {
          fileName = filenameMatch[1];
        }
        
        const contentTypeMatch = lines.find(line => line.startsWith('Content-Type:'));
        if (contentTypeMatch) {
          fileType = contentTypeMatch.split('Content-Type: ')[1];
        }
        
        // Extract file data (after empty line)
        const emptyLineIndex = lines.findIndex(line => line === '');
        if (emptyLineIndex !== -1) {
          const fileContent = lines.slice(emptyLineIndex + 1).join('\r\n');
          fileData = Buffer.from(fileContent, 'binary');
        }
      } else {
        // This is a regular field
        const nameMatch = disposition.match(/name="([^"]*)"/);
        if (nameMatch) {
          const fieldName = nameMatch[1];
          const emptyLineIndex = lines.findIndex(line => line === '');
          if (emptyLineIndex !== -1) {
            fields[fieldName] = lines.slice(emptyLineIndex + 1).join('\r\n').trim();
          }
        }
      }
    }
  }

  return { fields, fileData, fileName, fileType };
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const endpoint = getEndpoint(event);
    const method = event.httpMethod;
    
    // Verify user authentication for all endpoints
    const decoded = verifyUserToken(event);
    const userId = decoded.userId;

    // Initialize upload
    if (endpoint === '/initialize' && method === 'POST') {
      const { filename, fileSize, mimeType, workspaceId } = JSON.parse(event.body);
      
      // Validate inputs
      if (!filename || !fileSize || !mimeType) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      validateFile(filename, fileSize, mimeType);
      
      const uploadId = generateUploadId();
      const multipart = fileSize > 25 * 1024 * 1024; // Files over 25MB use multipart
      
      // Create upload record
      const upload = await prisma.upload.create({
        data: {
          id: uploadId,
          filename,
          fileSize,
          mimeType,
          status: 'pending',
          userId,
          workspaceId: workspaceId || 'default'
        }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          uploadId: upload.id,
          multipart,
          chunkSize: multipart ? 10 * 1024 * 1024 : undefined // 10MB chunks
        })
      };
    }

    // Direct file upload (small files)
    if (endpoint === '/' && method === 'POST') {
      try {
        const { fields, fileData, fileName, fileType } = await parseMultipartData(event);
        const { uploadId } = fields;

        if (!uploadId) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Upload ID is required' })
          };
        }

        // Find the upload record
        const upload = await prisma.upload.findFirst({
          where: { id: uploadId, userId }
        });

        if (!upload) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Upload not found' })
          };
        }

        if (upload.status !== 'pending') {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Upload already processed' })
          };
        }

        // Validate file
        validateFile(fileName, fileData.length, fileType);

        // For now, we'll store the file temporarily and mark upload as completed
        // In production, this would upload to DigitalOcean Spaces
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `${uploadId}_${fileName}`);
        fs.writeFileSync(tempFilePath, fileData);

        // Update upload status
        const updatedUpload = await prisma.upload.update({
          where: { id: uploadId },
          data: {
            status: 'completed',
            storageUrl: tempFilePath, // In production: DigitalOcean Spaces URL
            cdnUrl: tempFilePath, // In production: CDN URL
            uploadedAt: new Date()
          }
        });

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            upload: {
              id: updatedUpload.id,
              filename: updatedUpload.filename,
              fileSize: updatedUpload.fileSize,
              status: updatedUpload.status,
              storageUrl: updatedUpload.storageUrl,
              cdnUrl: updatedUpload.cdnUrl,
              uploadedAt: updatedUpload.uploadedAt
            }
          })
        };
      } catch (parseError) {
        console.error('Error parsing multipart data:', parseError);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to parse file upload' })
        };
      }
    }

    // Chunk upload (for large files)
    if (endpoint === '/chunk' && method === 'POST') {
      try {
        const { fields, fileData, fileName, fileType } = await parseMultipartData(event);
        const { uploadId, chunkIndex, totalChunks } = fields;

        if (!uploadId || chunkIndex === undefined || !totalChunks) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Missing chunk upload parameters' })
          };
        }

        // Find the upload record
        const upload = await prisma.upload.findFirst({
          where: { id: uploadId, userId }
        });

        if (!upload) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Upload not found' })
          };
        }

        const chunkNum = parseInt(chunkIndex);
        const totalChunkNum = parseInt(totalChunks);
        
        // Store chunk temporarily (in production, upload to DigitalOcean Spaces)
        const tempDir = os.tmpdir();
        const chunkDir = path.join(tempDir, uploadId);
        
        if (!fs.existsSync(chunkDir)) {
          fs.mkdirSync(chunkDir, { recursive: true });
        }

        const chunkPath = path.join(chunkDir, `chunk_${chunkNum}`);
        fs.writeFileSync(chunkPath, fileData);

        // Check if all chunks are uploaded
        const uploadedChunks = fs.readdirSync(chunkDir).filter(f => f.startsWith('chunk_')).length;
        
        if (uploadedChunks === totalChunkNum) {
          // Combine all chunks
          const combinedFilePath = path.join(tempDir, `${uploadId}_${upload.filename}`);
          const writeStream = fs.createWriteStream(combinedFilePath);
          
          for (let i = 0; i < totalChunkNum; i++) {
            const chunkPath = path.join(chunkDir, `chunk_${i}`);
            const chunkData = fs.readFileSync(chunkPath);
            writeStream.write(chunkData);
          }
          writeStream.end();

          // Clean up chunk directory
          fs.rmSync(chunkDir, { recursive: true, force: true });

          // Update upload status
          await prisma.upload.update({
            where: { id: uploadId },
            data: {
              status: 'completed',
              storageUrl: combinedFilePath,
              cdnUrl: combinedFilePath,
              uploadedAt: new Date()
            }
          });
        }

        const progress = Math.round((uploadedChunks / totalChunkNum) * 100);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            chunk: {
              partNumber: chunkNum,
              etag: `etag_${chunkNum}`,
              size: fileData.length
            },
            progress
          })
        };
      } catch (parseError) {
        console.error('Error parsing chunk data:', parseError);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to parse chunk upload' })
        };
      }
    }

    // Get upload status
    if (endpoint.match(/^\/[^\/]+\/status$/) && method === 'GET') {
      const uploadId = endpoint.split('/')[1];
      
      const upload = await prisma.upload.findFirst({
        where: { id: uploadId, userId },
        include: {
          jobs: {
            select: {
              id: true,
              type: true,
              status: true,
              progress: true
            }
          }
        }
      });

      if (!upload) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Upload not found' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          id: upload.id,
          filename: upload.filename,
          fileSize: upload.fileSize,
          status: upload.status,
          storageUrl: upload.storageUrl,
          cdnUrl: upload.cdnUrl,
          uploadedAt: upload.uploadedAt,
          processingJobs: upload.jobs
        })
      };
    }

    // List uploads
    if (endpoint === '/' && method === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters || {});
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '20');
      const offset = (page - 1) * limit;
      const status = params.get('status');
      const workspaceId = params.get('workspaceId');

      const where = { userId };
      if (status) where.status = status;
      if (workspaceId) where.workspaceId = workspaceId;

      const [uploads, totalUploads] = await Promise.all([
        prisma.upload.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.upload.count({ where })
      ]);

      const totalPages = Math.ceil(totalUploads / limit);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          data: uploads,
          pagination: {
            page,
            limit,
            total: totalUploads,
            pages: totalPages
          }
        })
      };
    }

    // Delete upload
    if (endpoint.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const uploadId = endpoint.split('/')[1];
      
      const upload = await prisma.upload.findFirst({
        where: { id: uploadId, userId }
      });

      if (!upload) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Upload not found' })
        };
      }

      // Delete file from storage (cleanup)
      if (upload.storageUrl && fs.existsSync(upload.storageUrl)) {
        fs.unlinkSync(upload.storageUrl);
      }

      // Delete from database
      await prisma.upload.delete({
        where: { id: uploadId }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Upload endpoint not found' })
    };

  } catch (error) {
    console.error('Upload function error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};