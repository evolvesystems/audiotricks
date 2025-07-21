# AudioTricks File Management & Storage Specification

## 📁 Overview

This specification defines the comprehensive file management and storage tracking system for AudioTricks, handling audio file uploads, storage optimization, chunking for large files, and lifecycle management.

## 🎯 Core Objectives

1. **File Lifecycle Management**: Track files from upload to deletion
2. **Storage Optimization**: Efficient storage allocation and cleanup
3. **Large File Handling**: Chunking and streaming for large audio files
4. **Multi-Provider Support**: Local, S3, Google Cloud Storage
5. **Cost Optimization**: Storage usage tracking and optimization
6. **Data Integrity**: Checksums and validation

## 📋 File Management Tables

### 1. Audio Uploads (`audio_uploads`)

**Purpose**: Central registry for all audio file uploads with complete metadata.

**File Information Fields**:
```sql
-- Basic file metadata
original_filename VARCHAR(500)  -- User's original filename
file_size BIGINT               -- File size in bytes
file_type VARCHAR(50)          -- Extension: mp3, wav, m4a, etc.
mime_type VARCHAR(100)         -- MIME type: audio/mpeg, audio/wav
duration DECIMAL(10,3)         -- Audio duration in seconds

-- Audio-specific metadata
sample_rate INTEGER            -- Sample rate in Hz (44100, 48000)
channels INTEGER               -- Number of audio channels (1=mono, 2=stereo)
bitrate INTEGER               -- Bitrate in kbps
codec VARCHAR(50)             -- Audio codec (mp3, aac, flac)

-- Technical metadata extracted during upload
metadata JSONB DEFAULT '{}'   -- Additional metadata from audio analysis
```

**Storage Information**:
```sql
-- Storage location and access
storage_provider VARCHAR(50)   -- local, s3, gcs, azure
storage_path TEXT             -- Full path to file
storage_url TEXT              -- Public URL (if applicable)
storage_region VARCHAR(50)    -- Storage region for geo-optimization

-- Data integrity
checksum_md5 VARCHAR(32)      -- MD5 hash for integrity verification
checksum_sha256 VARCHAR(64)   -- SHA256 hash for security
encryption_key_id UUID        -- Reference to encryption key (if encrypted)

-- Storage optimization
compression_type VARCHAR(20)  -- none, gzip, custom
original_size BIGINT          -- Size before compression
compressed_size BIGINT        -- Size after compression
```

**Processing Status Tracking**:
```sql
-- Upload and processing pipeline
status VARCHAR(50) DEFAULT 'uploaded'  -- uploaded, validating, processing, completed, failed, archived
uploaded_at TIMESTAMP DEFAULT NOW()
validation_started_at TIMESTAMP
validation_completed_at TIMESTAMP
processing_started_at TIMESTAMP
processing_completed_at TIMESTAMP
archived_at TIMESTAMP

-- Error handling
error_code VARCHAR(50)        -- Standardized error codes
error_message TEXT            -- Human-readable error description
retry_count INTEGER DEFAULT 0 -- Number of processing retries
max_retries INTEGER DEFAULT 3 -- Maximum retry attempts
```

### 2. Audio Chunks (`audio_chunks`)

**Purpose**: Handle large file processing by splitting into manageable chunks.

**Chunking Strategy**:
```sql
-- Chunk identification
upload_id UUID NOT NULL       -- Parent upload reference
chunk_index INTEGER NOT NULL  -- Sequential chunk number (0-based)
total_chunks INTEGER          -- Total number of chunks for this file

-- Temporal boundaries
start_time DECIMAL(10,3)      -- Start time in original audio (seconds)
end_time DECIMAL(10,3)        -- End time in original audio (seconds)
duration DECIMAL(10,3)        -- Chunk duration (end_time - start_time)

-- Chunk file information
chunk_filename VARCHAR(500)   -- Generated chunk filename
chunk_size BIGINT            -- Size of this chunk in bytes
chunk_path TEXT              -- Storage path for chunk file
checksum_md5 VARCHAR(32)     -- Integrity verification for chunk
```

**Processing Status**:
```sql
-- Chunk processing pipeline
status VARCHAR(50) DEFAULT 'pending'  -- pending, processing, completed, failed
processing_started_at TIMESTAMP
processing_completed_at TIMESTAMP
processing_time_ms BIGINT            -- Processing time for this chunk

-- Results linkage
transcription_result_id UUID         -- Link to transcription result
processing_job_id UUID               -- Link to processing job
```

**Chunk Management Functions**:
```sql
-- Function to create chunks for large files
CREATE OR REPLACE FUNCTION create_audio_chunks(
    upload_id UUID,
    file_duration DECIMAL(10,3),
    max_chunk_duration DECIMAL(10,3) DEFAULT 300.0  -- 5 minutes
) RETURNS INTEGER AS $$
DECLARE
    chunk_count INTEGER;
    chunk_index INTEGER := 0;
    start_time DECIMAL(10,3) := 0.0;
    end_time DECIMAL(10,3);
BEGIN
    chunk_count := CEIL(file_duration / max_chunk_duration);
    
    WHILE chunk_index < chunk_count LOOP
        end_time := LEAST(start_time + max_chunk_duration, file_duration);
        
        INSERT INTO audio_chunks (
            upload_id, chunk_index, total_chunks,
            start_time, end_time, duration,
            chunk_filename, status
        ) VALUES (
            upload_id, chunk_index, chunk_count,
            start_time, end_time, end_time - start_time,
            format('chunk_%s_%03d.wav', upload_id, chunk_index),
            'pending'
        );
        
        start_time := end_time;
        chunk_index := chunk_index + 1;
    END LOOP;
    
    RETURN chunk_count;
END;
$$ LANGUAGE plpgsql;
```

### 3. Storage Quotas (`storage_quotas`)

**Purpose**: Manage storage limits and usage per workspace.

**Quota Configuration**:
```sql
-- Storage limits
max_storage_bytes BIGINT      -- Maximum storage in bytes
max_file_count INTEGER        -- Maximum number of files
max_file_size BIGINT         -- Maximum individual file size
max_monthly_uploads INTEGER   -- Monthly upload limit

-- Usage tracking  
current_storage_bytes BIGINT DEFAULT 0  -- Current storage usage
current_file_count INTEGER DEFAULT 0    -- Current file count
monthly_uploads INTEGER DEFAULT 0       -- Uploads this month
monthly_upload_bytes BIGINT DEFAULT 0   -- Bytes uploaded this month

-- Lifecycle management
retention_days INTEGER                  -- Auto-delete after N days
auto_cleanup BOOLEAN DEFAULT false      -- Enable automatic cleanup
archive_threshold_days INTEGER          -- Archive after N days
archive_storage_class VARCHAR(50)       -- cold, glacier, etc.
```

**Quota Enforcement**:
```sql
-- Function to check storage quota before upload
CREATE OR REPLACE FUNCTION check_storage_quota(
    workspace_id UUID,
    file_size BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    quota storage_quotas%ROWTYPE;
    can_upload BOOLEAN := false;
BEGIN
    SELECT * INTO quota FROM storage_quotas WHERE workspace_id = workspace_id;
    
    IF NOT FOUND THEN
        -- No quota set, allow upload (should create default quota)
        RETURN true;
    END IF;
    
    -- Check storage limit
    IF quota.current_storage_bytes + file_size <= quota.max_storage_bytes THEN
        -- Check file count limit
        IF quota.current_file_count + 1 <= quota.max_file_count THEN
            -- Check individual file size limit
            IF file_size <= quota.max_file_size THEN
                can_upload := true;
            END IF;
        END IF;
    END IF;
    
    RETURN can_upload;
END;
$$ LANGUAGE plpgsql;
```

### 4. File Processing Cache (`file_processing_cache`)

**Purpose**: Cache processing results to avoid redundant operations.

```sql
CREATE TABLE file_processing_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File identification
    file_hash VARCHAR(64) NOT NULL,      -- SHA256 of original file
    file_size BIGINT NOT NULL,
    processing_options_hash VARCHAR(64), -- Hash of processing parameters
    
    -- Cache data
    cache_type VARCHAR(50) NOT NULL,     -- transcription, summary, analysis
    cache_data JSONB NOT NULL,           -- Cached results
    
    -- Cache metadata
    created_at TIMESTAMP DEFAULT NOW(),
    accessed_at TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    expires_at TIMESTAMP,                -- Optional expiration
    
    -- Storage optimization
    compressed BOOLEAN DEFAULT false,
    compression_ratio DECIMAL(4,2),
    
    UNIQUE(file_hash, processing_options_hash, cache_type)
);

-- Indexes for cache lookups
CREATE INDEX idx_file_cache_hash ON file_processing_cache(file_hash, processing_options_hash);
CREATE INDEX idx_file_cache_expires ON file_processing_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_file_cache_accessed ON file_processing_cache(accessed_at);
```

## 🗄️ Storage Provider Integration

### 1. Local Storage Provider

```typescript
interface LocalStorageProvider {
  async uploadFile(file: Buffer, path: string): Promise<{ url: string; size: number }>
  async downloadFile(path: string): Promise<Buffer>
  async deleteFile(path: string): Promise<void>
  async getFileMetadata(path: string): Promise<FileMetadata>
  async listFiles(prefix: string): Promise<string[]>
}

class LocalStorageService implements LocalStorageProvider {
  private readonly basePath: string
  
  constructor(basePath: string = './uploads') {
    this.basePath = basePath
  }
  
  async uploadFile(file: Buffer, path: string): Promise<{ url: string; size: number }> {
    const fullPath = join(this.basePath, path)
    await ensureDir(dirname(fullPath))
    await writeFile(fullPath, file)
    
    return {
      url: `/files/${path}`,
      size: file.length
    }
  }
  
  async generateChecksums(file: Buffer): Promise<{ md5: string; sha256: string }> {
    return {
      md5: createHash('md5').update(file).digest('hex'),
      sha256: createHash('sha256').update(file).digest('hex')
    }
  }
}
```

### 2. S3 Storage Provider

```typescript
class S3StorageService implements StorageProvider {
  private readonly s3Client: S3Client
  private readonly bucketName: string
  
  constructor(config: S3Config) {
    this.s3Client = new S3Client(config)
    this.bucketName = config.bucketName
  }
  
  async uploadFile(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
    const checksums = await this.generateChecksums(file)
    
    const uploadParams = {
      Bucket: this.bucketName,
      Key: path,
      Body: file,
      ContentType: options?.contentType || 'application/octet-stream',
      Metadata: {
        'original-filename': options?.originalFilename || '',
        'upload-timestamp': new Date().toISOString(),
        'checksum-md5': checksums.md5,
        'checksum-sha256': checksums.sha256
      },
      ServerSideEncryption: 'AES256',
      StorageClass: options?.storageClass || 'STANDARD'
    }
    
    const result = await this.s3Client.send(new PutObjectCommand(uploadParams))
    
    return {
      url: `https://${this.bucketName}.s3.amazonaws.com/${path}`,
      size: file.length,
      etag: result.ETag,
      checksums
    }
  }
  
  async configureLifecyclePolicy(): Promise<void> {
    const lifecycleConfig = {
      Bucket: this.bucketName,
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'AudioTricksLifecycle',
            Status: 'Enabled',
            Transitions: [
              {
                Days: 30,
                StorageClass: 'STANDARD_IA'  // Infrequent Access after 30 days
              },
              {
                Days: 90,
                StorageClass: 'GLACIER'      // Glacier after 90 days
              },
              {
                Days: 365,
                StorageClass: 'DEEP_ARCHIVE' // Deep Archive after 1 year
              }
            ]
          }
        ]
      }
    }
    
    await this.s3Client.send(new PutBucketLifecycleConfigurationCommand(lifecycleConfig))
  }
}
```

## 📊 Storage Analytics and Optimization

### 1. Storage Usage Analytics

```sql
-- Storage usage by workspace
CREATE VIEW storage_usage_by_workspace AS
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    COUNT(au.id) as file_count,
    SUM(au.file_size) as total_bytes,
    SUM(au.file_size) / (1024.0 * 1024.0) as total_mb,
    AVG(au.file_size) as avg_file_size,
    MIN(au.uploaded_at) as oldest_file,
    MAX(au.uploaded_at) as newest_file,
    sq.max_storage_bytes,
    sq.max_storage_bytes - SUM(au.file_size) as remaining_bytes
FROM workspaces w
LEFT JOIN audio_uploads au ON w.id = au.workspace_id
LEFT JOIN storage_quotas sq ON w.id = sq.workspace_id
WHERE au.status != 'deleted'
GROUP BY w.id, w.name, sq.max_storage_bytes;

-- Storage usage trends
WITH daily_storage AS (
    SELECT 
        workspace_id,
        DATE(uploaded_at) as upload_date,
        SUM(file_size) as daily_bytes,
        COUNT(*) as daily_files
    FROM audio_uploads 
    WHERE uploaded_at >= NOW() - INTERVAL '30 days'
    GROUP BY workspace_id, DATE(uploaded_at)
)
SELECT 
    workspace_id,
    upload_date,
    daily_bytes,
    daily_files,
    SUM(daily_bytes) OVER (
        PARTITION BY workspace_id 
        ORDER BY upload_date 
        ROWS UNBOUNDED PRECEDING
    ) as cumulative_bytes
FROM daily_storage
ORDER BY workspace_id, upload_date;
```

### 2. Storage Optimization Recommendations

```sql
-- Files eligible for archiving
CREATE VIEW archival_candidates AS
SELECT 
    au.id,
    au.workspace_id,
    au.original_filename,
    au.file_size,
    au.uploaded_at,
    au.storage_provider,
    EXTRACT(DAYS FROM NOW() - au.uploaded_at) as days_old,
    CASE 
        WHEN ah.id IS NULL THEN 'never_processed'
        WHEN EXTRACT(DAYS FROM NOW() - ah.created_at) > 90 THEN 'old_processed'
        ELSE 'recent_processed'
    END as processing_status
FROM audio_uploads au
LEFT JOIN audio_history ah ON au.id = ah.upload_id
WHERE au.status = 'completed'
    AND EXTRACT(DAYS FROM NOW() - au.uploaded_at) > 30
    AND au.storage_provider != 'archived';

-- Duplicate file detection
WITH file_duplicates AS (
    SELECT 
        checksum_sha256,
        COUNT(*) as duplicate_count,
        SUM(file_size) as total_wasted_bytes,
        array_agg(id ORDER BY uploaded_at) as upload_ids,
        array_agg(original_filename) as filenames
    FROM audio_uploads 
    WHERE checksum_sha256 IS NOT NULL
        AND status != 'deleted'
    GROUP BY checksum_sha256
    HAVING COUNT(*) > 1
)
SELECT 
    checksum_sha256,
    duplicate_count,
    total_wasted_bytes,
    total_wasted_bytes / (1024.0 * 1024.0) as wasted_mb,
    upload_ids,
    filenames
FROM file_duplicates
ORDER BY total_wasted_bytes DESC;
```

### 3. Automated Cleanup Jobs

```typescript
class StorageCleanupService {
  async runDailyCleanup(): Promise<CleanupResult> {
    const result = {
      archivedFiles: 0,
      deletedFiles: 0,
      freedBytes: 0
    }
    
    // 1. Archive old files
    const archivalCandidates = await this.getArchivalCandidates()
    for (const file of archivalCandidates) {
      await this.archiveFile(file.id)
      result.archivedFiles++
    }
    
    // 2. Delete expired files
    const expiredFiles = await this.getExpiredFiles()
    for (const file of expiredFiles) {
      const deletedSize = await this.deleteFile(file.id)
      result.freedBytes += deletedSize
      result.deletedFiles++
    }
    
    // 3. Clean up orphaned chunks
    await this.cleanupOrphanedChunks()
    
    // 4. Update storage quotas
    await this.updateStorageUsage()
    
    return result
  }
  
  async archiveFile(uploadId: string): Promise<void> {
    const upload = await this.getUpload(uploadId)
    
    if (upload.storageProvider === 'local') {
      // Move to S3 Glacier
      await this.moveToS3Archive(upload)
    } else if (upload.storageProvider === 's3') {
      // Transition to Glacier
      await this.transitionToGlacier(upload)
    }
    
    // Update database
    await this.updateUploadStatus(uploadId, 'archived')
  }
  
  async cleanupOrphanedChunks(): Promise<number> {
    // Find chunks without parent uploads
    const orphanedChunks = await this.prisma.audioChunk.findMany({
      where: {
        upload: null
      }
    })
    
    for (const chunk of orphanedChunks) {
      await this.deleteChunkFile(chunk.chunkPath)
      await this.prisma.audioChunk.delete({
        where: { id: chunk.id }
      })
    }
    
    return orphanedChunks.length
  }
}
```

## 🔄 File Lifecycle Management

### Upload Pipeline

```typescript
class FileUploadService {
  async processUpload(file: UploadedFile, userId: string, workspaceId?: string): Promise<AudioUpload> {
    // 1. Validate file
    await this.validateFile(file)
    
    // 2. Check quotas
    await this.checkStorageQuota(workspaceId, file.size)
    
    // 3. Generate checksums
    const checksums = await this.generateChecksums(file.buffer)
    
    // 4. Check for duplicates
    const existing = await this.findExistingFile(checksums.sha256)
    if (existing) {
      return await this.handleDuplicateFile(existing, userId, workspaceId)
    }
    
    // 5. Extract metadata
    const metadata = await this.extractAudioMetadata(file.buffer)
    
    // 6. Upload to storage
    const storageResult = await this.storageProvider.uploadFile(
      file.buffer,
      this.generateStoragePath(userId, file.originalname),
      {
        contentType: file.mimetype,
        originalFilename: file.originalname
      }
    )
    
    // 7. Create database record
    const upload = await this.prisma.audioUpload.create({
      data: {
        userId,
        workspaceId,
        originalFilename: file.originalname,
        fileSize: file.size,
        fileType: path.extname(file.originalname).slice(1),
        mimeType: file.mimetype,
        duration: metadata.duration,
        sampleRate: metadata.sampleRate,
        channels: metadata.channels,
        bitrate: metadata.bitrate,
        storageProvider: this.storageProvider.name,
        storagePath: storageResult.path,
        storageUrl: storageResult.url,
        checksumMd5: checksums.md5,
        checksumSha256: checksums.sha256,
        status: 'uploaded'
      }
    })
    
    // 8. Create chunks if file is large
    if (metadata.duration > 300) { // 5 minutes
      await this.createChunks(upload.id, metadata.duration)
    }
    
    // 9. Queue for processing
    await this.queueProcessingJob(upload.id)
    
    // 10. Update storage usage
    await this.updateStorageUsage(workspaceId, file.size)
    
    return upload
  }
  
  private generateStoragePath(userId: string, filename: string): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const uuid = randomUUID()
    
    return `uploads/${userId}/${year}/${month}/${day}/${uuid}-${filename}`
  }
}
```

## 📈 Performance Optimization

### 1. Chunked Upload for Large Files

```typescript
class ChunkedUploadService {
  async initiateChunkedUpload(
    filename: string,
    fileSize: number,
    chunkSize: number = 5 * 1024 * 1024 // 5MB chunks
  ): Promise<ChunkedUpload> {
    const totalChunks = Math.ceil(fileSize / chunkSize)
    const uploadId = randomUUID()
    
    return await this.prisma.chunkedUpload.create({
      data: {
        id: uploadId,
        filename,
        fileSize,
        totalChunks,
        chunkSize,
        status: 'initiated'
      }
    })
  }
  
  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: Buffer
  ): Promise<ChunkUploadResult> {
    const upload = await this.getChunkedUpload(uploadId)
    
    // Validate chunk
    if (chunkIndex >= upload.totalChunks) {
      throw new Error('Invalid chunk index')
    }
    
    // Store chunk
    const chunkPath = `chunks/${uploadId}/${chunkIndex}`
    await this.storageProvider.uploadFile(chunkData, chunkPath)
    
    // Update progress
    const completedChunks = await this.getCompletedChunkCount(uploadId)
    
    if (completedChunks === upload.totalChunks) {
      // All chunks uploaded, reassemble file
      await this.reassembleFile(uploadId)
    }
    
    return {
      chunkIndex,
      completed: completedChunks,
      total: upload.totalChunks,
      progress: completedChunks / upload.totalChunks
    }
  }
}
```

### 2. Intelligent Caching

```typescript
class ProcessingCacheService {
  async getCachedResult(
    fileHash: string,
    processingOptions: ProcessingOptions
  ): Promise<CachedResult | null> {
    const optionsHash = this.hashProcessingOptions(processingOptions)
    
    const cached = await this.prisma.fileProcessingCache.findUnique({
      where: {
        fileHash_processingOptionsHash_cacheType: {
          fileHash,
          processingOptionsHash: optionsHash,
          cacheType: processingOptions.type
        }
      }
    })
    
    if (cached && this.isCacheValid(cached)) {
      // Update access tracking
      await this.updateCacheAccess(cached.id)
      return cached
    }
    
    return null
  }
  
  async setCachedResult(
    fileHash: string,
    processingOptions: ProcessingOptions,
    result: any
  ): Promise<void> {
    const optionsHash = this.hashProcessingOptions(processingOptions)
    
    await this.prisma.fileProcessingCache.upsert({
      where: {
        fileHash_processingOptionsHash_cacheType: {
          fileHash,
          processingOptionsHash: optionsHash,
          cacheType: processingOptions.type
        }
      },
      create: {
        fileHash,
        processingOptionsHash: optionsHash,
        cacheType: processingOptions.type,
        cacheData: result,
        expiresAt: this.calculateExpiry(processingOptions.type)
      },
      update: {
        cacheData: result,
        accessedAt: new Date(),
        accessCount: { increment: 1 }
      }
    })
  }
}
```

This comprehensive file management system provides robust handling of audio files from upload to deletion, with support for multiple storage providers, intelligent caching, and optimization for both performance and cost.