const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Helper to handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Helper to parse request path
const getEndpoint = (event) => {
  const path = event.path.replace('/api/user', '').replace('/.netlify/functions/user', '');
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

    // Dashboard stats
    if (endpoint === '/dashboard/stats' && method === 'GET') {
      const [
        userProjects,
        userJobs,
        completedJobs,
        processingJobs,
        failedJobs
      ] = await Promise.all([
        prisma.project.count({ where: { userId } }),
        prisma.job.count({ where: { userId } }),
        prisma.job.count({ where: { userId, status: 'completed' } }),
        prisma.job.count({ where: { userId, status: 'processing' } }),
        prisma.job.count({ where: { userId, status: 'failed' } })
      ]);

      // Get usage this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const monthlyJobs = await prisma.job.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth }
        }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          stats: {
            totalProjects: userProjects,
            totalJobs: userJobs,
            completedJobs,
            processingJobs,
            failedJobs,
            usageThisMonth: {
              audioFiles: monthlyJobs,
              storageUsed: 0, // TODO: Calculate from file sizes
              apiCalls: monthlyJobs
            },
            limits: {
              audioFiles: 100, // TODO: Get from user plan
              storage: 5,
              apiCalls: 1000
            }
          }
        })
      };
    }

    // Recent projects
    if (endpoint === '/dashboard/projects' && method === 'GET') {
      const projects = await prisma.project.findMany({
        where: { userId },
        include: {
          _count: {
            select: { jobs: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          projects: projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            jobCount: project._count.jobs,
            status: 'active' // TODO: Add status field to project model
          }))
        })
      };
    }

    // Recent jobs
    if (endpoint === '/dashboard/jobs' && method === 'GET') {
      const jobs = await prisma.job.findMany({
        where: { userId },
        include: {
          project: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          jobs: jobs.map(job => ({
            id: job.id,
            fileName: job.fileName,
            projectId: job.projectId,
            projectName: job.project?.name || 'Unknown Project',
            status: job.status,
            createdAt: job.createdAt.toISOString(),
            completedAt: job.completedAt?.toISOString(),
            duration: job.duration
          }))
        })
      };
    }

    // All projects (for projects page)
    if (endpoint === '/projects' && method === 'GET') {
      const projects = await prisma.project.findMany({
        where: { userId },
        include: {
          _count: {
            select: { jobs: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          projects: projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            jobCount: project._count.jobs,
            status: 'active'
          }))
        })
      };
    }

    // All jobs (for jobs page)
    if (endpoint === '/jobs' && method === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters || {});
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '20');
      const offset = (page - 1) * limit;

      const [jobs, totalJobs] = await Promise.all([
        prisma.job.findMany({
          where: { userId },
          include: {
            project: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.job.count({ where: { userId } })
      ]);

      const totalPages = Math.ceil(totalJobs / limit);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          jobs: jobs.map(job => ({
            id: job.id,
            fileName: job.fileName,
            projectId: job.projectId,
            projectName: job.project?.name || 'Unknown Project',
            status: job.status,
            createdAt: job.createdAt.toISOString(),
            completedAt: job.completedAt?.toISOString(),
            duration: job.duration,
            fileSize: job.fileSize
          })),
          pagination: {
            page,
            limit,
            total: totalJobs,
            pages: totalPages
          }
        })
      };
    }

    // Project detail
    if (endpoint.match(/^\/projects\/[^\/]+$/) && method === 'GET') {
      const projectId = endpoint.split('/')[2];
      
      const project = await prisma.project.findFirst({
        where: { 
          id: projectId,
          userId // Ensure user owns this project
        },
        include: {
          jobs: {
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { jobs: true }
          }
        }
      });

      if (!project) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Project not found' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            jobCount: project._count.jobs,
            status: 'active',
            jobs: project.jobs.map(job => ({
              id: job.id,
              fileName: job.fileName,
              status: job.status,
              createdAt: job.createdAt.toISOString(),
              completedAt: job.completedAt?.toISOString(),
              duration: job.duration
            }))
          }
        })
      };
    }

    // Job detail
    if (endpoint.match(/^\/jobs\/[^\/]+$/) && method === 'GET') {
      const jobId = endpoint.split('/')[2];
      
      const job = await prisma.job.findFirst({
        where: { 
          id: jobId,
          userId // Ensure user owns this job
        },
        include: {
          project: {
            select: { name: true }
          }
        }
      });

      if (!job) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Job not found' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          job: {
            id: job.id,
            fileName: job.fileName,
            projectId: job.projectId,
            projectName: job.project?.name || 'Unknown Project',
            status: job.status,
            createdAt: job.createdAt.toISOString(),
            completedAt: job.completedAt?.toISOString(),
            duration: job.duration,
            fileSize: job.fileSize,
            results: job.results // Transcription results
          }
        })
      };
    }

    // Billing history
    if (endpoint === '/billing-history' && method === 'GET') {
      // TODO: Implement billing history from subscription/payment tables
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          records: []
        })
      };
    }

    // Team members (workspace members)
    if (endpoint === '/team/members' || endpoint.startsWith('/team/')) {
      // TODO: Implement team management endpoints
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          members: []
        })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'User endpoint not found' })
    };

  } catch (error) {
    console.error('User function error:', error);
    
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