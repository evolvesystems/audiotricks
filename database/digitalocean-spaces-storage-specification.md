# AudioTricks DigitalOcean Spaces Storage Integration - Complete Specification

## 🎯 **Executive Summary**

This specification defines the integration of DigitalOcean Spaces as the primary storage solution for AudioTricks. DigitalOcean Spaces provides S3-compatible object storage with global CDN distribution, making it ideal for storing audio files, processed transcripts, and user-generated content with high availability and performance.

---

## ☁️ **DigitalOcean Spaces Architecture**

### **Storage Strategy**

**🗂️ Bucket Organization**
- **Primary Bucket**: `audiotricks-production` (or `audiotricks-staging`)
- **Backup Bucket**: `audiotricks-backups`
- **CDN Endpoint**: `cdn.audiotricks.com` (custom domain)
- **Direct Endpoint**: `audiotricks-production.nyc3.digitaloceanspaces.com`

**📁 Directory Structure**
```
audiotricks-production/
├── audio/
│   ├── uploads/           # Original uploaded files
│   ├── processed/         # Processed/converted audio
│   └── chunks/           # Audio file chunks for large files
├── exports/
│   ├── transcripts/      # Export files (PDF, TXT, etc.)
│   └── bulk/            # Bulk export archives
├── temp/
│   ├── uploads/         # Temporary upload staging
│   └── processing/      # Temporary processing files
├── backups/
│   ├── database/        # Database backups
│   └── user-data/       # User data archives
└── static/
    ├── avatars/         # User profile images
    └── workspace-assets/ # Workspace branding assets
```

**🌍 CDN Configuration**
- **Global Distribution**: Automatic edge caching worldwide
- **Cache Headers**: Optimized for audio file delivery
- **Custom Domain**: `cdn.audiotricks.com` for branded URLs
- **SSL/TLS**: Automatic HTTPS for all content

---

## 💾 **Enhanced Database Schema for DigitalOcean Spaces**

### **Storage Management Tables**

```sql
-- DigitalOcean Spaces storage configuration
CREATE TABLE IF NOT EXISTS storage_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider Details
    provider_name VARCHAR(50) NOT NULL, -- digitalocean_spaces, s3, gcs
    provider_type VARCHAR(50) NOT NULL DEFAULT 'object_storage',
    
    -- DigitalOcean Spaces Configuration
    endpoint_url VARCHAR(255) NOT NULL, -- nyc3.digitaloceanspaces.com
    region VARCHAR(50) NOT NULL, -- nyc3, ams3, sgp1, etc.
    bucket_name VARCHAR(255) NOT NULL,
    
    -- CDN Configuration
    cdn_endpoint VARCHAR(255), -- cdn.audiotricks.com
    cdn_enabled BOOLEAN DEFAULT true,
    
    -- Access Configuration
    access_key_id VARCHAR(255) NOT NULL,
    secret_access_key_encrypted TEXT NOT NULL,
    
    -- Settings
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    max_file_size BIGINT DEFAULT 5368709120, -- 5GB default
    allowed_file_types TEXT[] DEFAULT ARRAY['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus'],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_provider_name CHECK (provider_name IN ('digitalocean_spaces', 's3', 'gcs', 'azure_blob')),
    CONSTRAINT unique_primary_provider UNIQUE (is_primary) WHERE is_primary = true
);

-- Enhanced file storage tracking with DigitalOcean Spaces support
CREATE TABLE IF NOT EXISTS file_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File Identity
    original_filename VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500) NOT NULL, -- UUID-based filename
    file_extension VARCHAR(20),
    mime_type VARCHAR(100),
    
    -- Storage Details
    storage_provider_id UUID NOT NULL REFERENCES storage_providers(id),
    storage_path VARCHAR(1000) NOT NULL, -- audio/uploads/2024/01/uuid.mp3
    storage_url VARCHAR(1000), -- Full DigitalOcean Spaces URL
    cdn_url VARCHAR(1000), -- CDN URL for faster delivery
    
    -- File Metadata
    file_size BIGINT NOT NULL,
    checksum_md5 VARCHAR(32),
    checksum_sha256 VARCHAR(64),
    
    -- Upload Information
    upload_method VARCHAR(50) DEFAULT 'direct', -- direct, multipart, resumable
    upload_session_id VARCHAR(255), -- For multipart uploads
    
    -- Processing Status
    status VARCHAR(50) DEFAULT 'uploading', -- uploading, stored, processing, processed, failed, deleted
    
    -- Content Classification
    content_type VARCHAR(50) NOT NULL, -- audio_file, export_file, avatar, document
    content_category VARCHAR(50), -- original, processed, chunk, thumbnail
    
    -- Ownership and Access
    user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    is_public BOOLEAN DEFAULT false,
    access_level VARCHAR(50) DEFAULT 'private', -- private, workspace, public
    
    -- Lifecycle Management
    expires_at TIMESTAMP, -- For temporary files
    archived_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Performance Metadata
    download_count BIGINT DEFAULT 0,
    last_accessed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_file_status CHECK (status IN ('uploading', 'stored', 'processing', 'processed', 'failed', 'deleted')),
    CONSTRAINT chk_content_type CHECK (content_type IN ('audio_file', 'export_file', 'avatar', 'document', 'backup')),
    CONSTRAINT chk_access_level CHECK (access_level IN ('private', 'workspace', 'public'))
);

-- Multipart upload tracking for large files
CREATE TABLE IF NOT EXISTS multipart_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Upload Session
    upload_session_id VARCHAR(255) UNIQUE NOT NULL,
    file_storage_id UUID REFERENCES file_storage(id) ON DELETE CASCADE,
    
    -- DigitalOcean Spaces Multipart Details
    spaces_upload_id VARCHAR(255) NOT NULL, -- From DigitalOcean Spaces
    
    -- File Information
    original_filename VARCHAR(500) NOT NULL,
    total_file_size BIGINT NOT NULL,
    chunk_size BIGINT DEFAULT 10485760, -- 10MB default chunk size
    total_chunks INTEGER NOT NULL,
    
    -- Progress Tracking
    completed_chunks INTEGER DEFAULT 0,
    uploaded_bytes BIGINT DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, completed, aborted, failed
    
    -- Ownership
    user_id UUID NOT NULL REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    
    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
    completed_at TIMESTAMP,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT chk_multipart_status CHECK (status IN ('active', 'completed', 'aborted', 'failed'))
);

-- Individual chunk tracking for multipart uploads
CREATE TABLE IF NOT EXISTS upload_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Chunk Identity
    multipart_upload_id UUID NOT NULL REFERENCES multipart_uploads(id) ON DELETE CASCADE,
    chunk_number INTEGER NOT NULL,
    
    -- DigitalOcean Spaces Details
    spaces_etag VARCHAR(255), -- ETag from DigitalOcean Spaces
    
    -- Chunk Information
    chunk_size BIGINT NOT NULL,
    start_byte BIGINT NOT NULL,
    end_byte BIGINT NOT NULL,
    checksum_md5 VARCHAR(32),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, uploading, completed, failed
    
    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_at TIMESTAMP,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Constraints
    CONSTRAINT chk_chunk_status CHECK (status IN ('pending', 'uploading', 'completed', 'failed')),
    CONSTRAINT unique_chunk_per_upload UNIQUE (multipart_upload_id, chunk_number)
);

-- Storage usage tracking and quotas
CREATE TABLE IF NOT EXISTS storage_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope
    user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    
    -- Usage Metrics
    total_files INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    audio_files_count INTEGER DEFAULT 0,
    audio_files_size BIGINT DEFAULT 0,
    export_files_count INTEGER DEFAULT 0,
    export_files_size BIGINT DEFAULT 0,
    
    -- Storage Provider Breakdown
    spaces_files_count INTEGER DEFAULT 0,
    spaces_size_bytes BIGINT DEFAULT 0,
    
    -- Quota Information
    storage_quota_bytes BIGINT,
    file_count_quota INTEGER,
    
    -- Period Tracking
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Status
    is_current_period BOOLEAN DEFAULT true,
    
    -- Timestamps
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_usage_period UNIQUE (user_id, workspace_id, period_start, period_end)
);

-- DigitalOcean Spaces specific operations log
CREATE TABLE IF NOT EXISTS spaces_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Operation Details
    operation_type VARCHAR(50) NOT NULL, -- upload, download, delete, copy, list
    operation_id VARCHAR(255), -- Request ID from DigitalOcean
    
    -- File Reference
    file_storage_id UUID REFERENCES file_storage(id),
    storage_path VARCHAR(1000),
    
    -- Request Details
    http_method VARCHAR(10), -- GET, PUT, POST, DELETE
    endpoint_url VARCHAR(500),
    request_headers JSONB,
    response_headers JSONB,
    
    -- Performance Metrics
    request_size BIGINT,
    response_size BIGINT,
    duration_ms INTEGER,
    
    -- Status
    status_code INTEGER,
    success BOOLEAN,
    error_message TEXT,
    
    -- User Context
    user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_operation_type CHECK (operation_type IN ('upload', 'download', 'delete', 'copy', 'list', 'head'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_file_storage_user_workspace ON file_storage(user_id, workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_file_storage_content_type ON file_storage(content_type, created_at);
CREATE INDEX IF NOT EXISTS idx_file_storage_status_created ON file_storage(status, created_at);
CREATE INDEX IF NOT EXISTS idx_multipart_uploads_session ON multipart_uploads(upload_session_id, status);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_multipart ON upload_chunks(multipart_upload_id, chunk_number);
CREATE INDEX IF NOT EXISTS idx_storage_usage_current ON storage_usage(user_id, workspace_id, is_current_period);
CREATE INDEX IF NOT EXISTS idx_spaces_operations_file ON spaces_operations(file_storage_id, operation_type, started_at);
```

---

## 🔧 **Core Storage Functions**

### **1. DigitalOcean Spaces Configuration**

```sql
-- Function to initialize DigitalOcean Spaces configuration
CREATE OR REPLACE FUNCTION setup_digitalocean_spaces(
    endpoint_url_param VARCHAR(255),
    region_param VARCHAR(50),
    bucket_name_param VARCHAR(255),
    access_key_param VARCHAR(255),
    secret_key_param TEXT,
    cdn_endpoint_param VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    provider_id UUID;
    encrypted_secret TEXT;
BEGIN
    -- Encrypt the secret access key (in practice, use proper encryption)
    encrypted_secret := secret_key_param; -- Placeholder for actual encryption
    
    -- Insert storage provider configuration
    INSERT INTO storage_providers (
        provider_name,
        provider_type,
        endpoint_url,
        region,
        bucket_name,
        cdn_endpoint,
        cdn_enabled,
        access_key_id,
        secret_access_key_encrypted,
        is_primary,
        is_active
    ) VALUES (
        'digitalocean_spaces',
        'object_storage',
        endpoint_url_param,
        region_param,
        bucket_name_param,
        cdn_endpoint_param,
        CASE WHEN cdn_endpoint_param IS NOT NULL THEN true ELSE false END,
        access_key_param,
        encrypted_secret,
        true, -- Set as primary provider
        true
    ) RETURNING id INTO provider_id;
    
    -- Create audit log
    INSERT INTO audit_logs (
        action,
        resource,
        resource_id,
        category,
        details
    ) VALUES (
        'setup_storage_provider',
        'storage_provider',
        provider_id,
        'system_configuration',
        jsonb_build_object(
            'provider', 'digitalocean_spaces',
            'region', region_param,
            'bucket', bucket_name_param,
            'cdn_enabled', CASE WHEN cdn_endpoint_param IS NOT NULL THEN true ELSE false END
        )
    );
    
    RETURN provider_id;
END;
$$ LANGUAGE plpgsql;
```

### **2. File Upload Management**

```sql
-- Function to initiate file storage
CREATE OR REPLACE FUNCTION initiate_file_storage(
    original_filename_param VARCHAR(500),
    file_size_param BIGINT,
    mime_type_param VARCHAR(100),
    content_type_param VARCHAR(50),
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL,
    use_multipart BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    file_storage_id UUID,
    storage_path TEXT,
    upload_url TEXT,
    upload_method VARCHAR(50),
    multipart_session_id VARCHAR(255)
) AS $$
DECLARE
    storage_id UUID;
    provider_record RECORD;
    file_extension VARCHAR(20);
    stored_filename VARCHAR(500);
    path_prefix VARCHAR(100);
    full_storage_path VARCHAR(1000);
    should_use_multipart BOOLEAN;
    session_id VARCHAR(255);
    upload_url_result TEXT;
BEGIN
    -- Get primary storage provider
    SELECT * INTO provider_record
    FROM storage_providers
    WHERE is_primary = true AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active primary storage provider configured';
    END IF;
    
    -- Extract file extension
    file_extension := LOWER(RIGHT(original_filename_param, 4));
    IF LEFT(file_extension, 1) = '.' THEN
        file_extension := RIGHT(file_extension, 3);
    END IF;
    
    -- Generate stored filename
    stored_filename := gen_random_uuid()::TEXT || '.' || file_extension;
    
    -- Determine storage path based on content type
    path_prefix := CASE content_type_param
        WHEN 'audio_file' THEN 'audio/uploads/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM')
        WHEN 'export_file' THEN 'exports/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM')
        WHEN 'avatar' THEN 'static/avatars'
        WHEN 'document' THEN 'documents/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM')
        ELSE 'misc/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM')
    END;
    
    full_storage_path := path_prefix || '/' || stored_filename;
    
    -- Determine if multipart upload should be used
    should_use_multipart := COALESCE(use_multipart, file_size_param > 10485760); -- 10MB threshold
    
    -- Create file storage record
    INSERT INTO file_storage (
        original_filename,
        stored_filename,
        file_extension,
        mime_type,
        storage_provider_id,
        storage_path,
        storage_url,
        cdn_url,
        file_size,
        upload_method,
        status,
        content_type,
        user_id,
        workspace_id
    ) VALUES (
        original_filename_param,
        stored_filename,
        file_extension,
        mime_type_param,
        provider_record.id,
        full_storage_path,
        'https://' || provider_record.endpoint_url || '/' || full_storage_path,
        CASE WHEN provider_record.cdn_endpoint IS NOT NULL 
             THEN 'https://' || provider_record.cdn_endpoint || '/' || full_storage_path 
             ELSE NULL END,
        file_size_param,
        CASE WHEN should_use_multipart THEN 'multipart' ELSE 'direct' END,
        'uploading',
        content_type_param,
        user_uuid,
        workspace_uuid
    ) RETURNING id INTO storage_id;
    
    -- If multipart upload, create multipart session
    IF should_use_multipart THEN
        session_id := 'mp_' || gen_random_uuid()::TEXT;
        upload_url_result := 'multipart_session_created';
        
        -- Create multipart upload record (actual DigitalOcean Spaces upload ID would be generated by API)
        INSERT INTO multipart_uploads (
            upload_session_id,
            file_storage_id,
            spaces_upload_id,
            original_filename,
            total_file_size,
            total_chunks,
            user_id,
            workspace_id
        ) VALUES (
            session_id,
            storage_id,
            'do_spaces_upload_' || gen_random_uuid()::TEXT, -- Placeholder
            original_filename_param,
            file_size_param,
            CEIL(file_size_param / 10485760.0)::INTEGER, -- 10MB chunks
            user_uuid,
            workspace_uuid
        );
    ELSE
        upload_url_result := 'https://' || provider_record.endpoint_url || '/' || full_storage_path;
    END IF;
    
    RETURN QUERY SELECT
        storage_id,
        full_storage_path,
        upload_url_result,
        CASE WHEN should_use_multipart THEN 'multipart' ELSE 'direct' END,
        session_id;
END;
$$ LANGUAGE plpgsql;
```

### **3. Multipart Upload Management**

```sql
-- Function to get presigned URLs for multipart upload chunks
CREATE OR REPLACE FUNCTION get_multipart_upload_urls(
    session_id_param VARCHAR(255),
    chunk_numbers INTEGER[]
)
RETURNS TABLE (
    chunk_number INTEGER,
    upload_url TEXT,
    chunk_id UUID
) AS $$
DECLARE
    multipart_record RECORD;
    chunk_num INTEGER;
    chunk_uuid UUID;
    presigned_url TEXT;
BEGIN
    -- Get multipart upload record
    SELECT * INTO multipart_record
    FROM multipart_uploads mu
    JOIN file_storage fs ON mu.file_storage_id = fs.id
    JOIN storage_providers sp ON fs.storage_provider_id = sp.id
    WHERE mu.upload_session_id = session_id_param
        AND mu.status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Multipart upload session not found or not active: %', session_id_param;
    END IF;
    
    -- Generate URLs for each requested chunk
    FOREACH chunk_num IN ARRAY chunk_numbers
    LOOP
        -- Create or get chunk record
        INSERT INTO upload_chunks (
            multipart_upload_id,
            chunk_number,
            chunk_size,
            start_byte,
            end_byte,
            status
        ) VALUES (
            multipart_record.id,
            chunk_num,
            CASE 
                WHEN chunk_num = multipart_record.total_chunks 
                THEN multipart_record.total_file_size - ((chunk_num - 1) * multipart_record.chunk_size)
                ELSE multipart_record.chunk_size
            END,
            (chunk_num - 1) * multipart_record.chunk_size,
            CASE 
                WHEN chunk_num = multipart_record.total_chunks 
                THEN multipart_record.total_file_size - 1
                ELSE (chunk_num * multipart_record.chunk_size) - 1
            END,
            'pending'
        ) ON CONFLICT (multipart_upload_id, chunk_number) 
        DO UPDATE SET status = 'pending'
        RETURNING id INTO chunk_uuid;
        
        -- Generate presigned URL (in practice, this would call DigitalOcean Spaces API)
        presigned_url := 'https://' || multipart_record.endpoint_url || 
                        '/' || multipart_record.storage_path || 
                        '?partNumber=' || chunk_num || 
                        '&uploadId=' || multipart_record.spaces_upload_id;
        
        RETURN QUERY SELECT chunk_num, presigned_url, chunk_uuid;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### **4. Storage Usage Tracking**

```sql
-- Function to update storage usage statistics
CREATE OR REPLACE FUNCTION update_storage_usage(
    user_uuid UUID DEFAULT NULL,
    workspace_uuid UUID DEFAULT NULL,
    force_recalculate BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
    current_period_start DATE;
    current_period_end DATE;
    usage_record RECORD;
BEGIN
    -- Calculate current period (monthly)
    current_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Update or insert usage record
    WITH storage_stats AS (
        SELECT 
            fs.user_id,
            fs.workspace_id,
            COUNT(*) as total_files,
            SUM(fs.file_size) as total_size_bytes,
            COUNT(*) FILTER (WHERE fs.content_type = 'audio_file') as audio_files_count,
            SUM(fs.file_size) FILTER (WHERE fs.content_type = 'audio_file') as audio_files_size,
            COUNT(*) FILTER (WHERE fs.content_type = 'export_file') as export_files_count,
            SUM(fs.file_size) FILTER (WHERE fs.content_type = 'export_file') as export_files_size,
            COUNT(*) FILTER (WHERE sp.provider_name = 'digitalocean_spaces') as spaces_files_count,
            SUM(fs.file_size) FILTER (WHERE sp.provider_name = 'digitalocean_spaces') as spaces_size_bytes
        FROM file_storage fs
        JOIN storage_providers sp ON fs.storage_provider_id = sp.id
        WHERE fs.status IN ('stored', 'processed')
            AND fs.deleted_at IS NULL
            AND (user_uuid IS NULL OR fs.user_id = user_uuid)
            AND (workspace_uuid IS NULL OR fs.workspace_id = workspace_uuid)
        GROUP BY fs.user_id, fs.workspace_id
    )
    INSERT INTO storage_usage (
        user_id,
        workspace_id,
        total_files,
        total_size_bytes,
        audio_files_count,
        audio_files_size,
        export_files_count,
        export_files_size,
        spaces_files_count,
        spaces_size_bytes,
        period_start,
        period_end,
        is_current_period
    )
    SELECT 
        ss.user_id,
        ss.workspace_id,
        ss.total_files,
        ss.total_size_bytes,
        ss.audio_files_count,
        COALESCE(ss.audio_files_size, 0),
        ss.export_files_count,
        COALESCE(ss.export_files_size, 0),
        ss.spaces_files_count,
        COALESCE(ss.spaces_size_bytes, 0),
        current_period_start,
        current_period_end,
        true
    FROM storage_stats ss
    ON CONFLICT (user_id, workspace_id, period_start, period_end)
    DO UPDATE SET
        total_files = EXCLUDED.total_files,
        total_size_bytes = EXCLUDED.total_size_bytes,
        audio_files_count = EXCLUDED.audio_files_count,
        audio_files_size = EXCLUDED.audio_files_size,
        export_files_count = EXCLUDED.export_files_count,
        export_files_size = EXCLUDED.export_files_size,
        spaces_files_count = EXCLUDED.spaces_files_count,
        spaces_size_bytes = EXCLUDED.spaces_size_bytes,
        calculated_at = CURRENT_TIMESTAMP;
    
    -- Mark previous periods as not current
    UPDATE storage_usage
    SET is_current_period = false
    WHERE period_start < current_period_start
        AND is_current_period = true
        AND (user_uuid IS NULL OR user_id = user_uuid)
        AND (workspace_uuid IS NULL OR workspace_id = workspace_uuid);
END;
$$ LANGUAGE plpgsql;
```

### **5. File Cleanup and Lifecycle Management**

```sql
-- Function to cleanup expired and temporary files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    file_record RECORD;
BEGIN
    -- Find expired files
    FOR file_record IN
        SELECT fs.*, sp.endpoint_url, sp.bucket_name
        FROM file_storage fs
        JOIN storage_providers sp ON fs.storage_provider_id = sp.id
        WHERE (
            (fs.expires_at IS NOT NULL AND fs.expires_at < CURRENT_TIMESTAMP) OR
            (fs.status = 'uploading' AND fs.created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours') OR
            (fs.content_type = 'export_file' AND fs.created_at < CURRENT_TIMESTAMP - INTERVAL '7 days')
        )
        AND fs.deleted_at IS NULL
        AND fs.status != 'deleted'
    LOOP
        -- Mark file as deleted
        UPDATE file_storage
        SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP
        WHERE id = file_record.id;
        
        -- Log the cleanup operation
        INSERT INTO spaces_operations (
            operation_type,
            file_storage_id,
            storage_path,
            endpoint_url,
            status_code,
            success,
            user_id,
            workspace_id,
            started_at,
            completed_at
        ) VALUES (
            'delete',
            file_record.id,
            file_record.storage_path,
            file_record.endpoint_url,
            200, -- Assume success for now
            true,
            file_record.user_id,
            file_record.workspace_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    -- Cleanup incomplete multipart uploads older than 24 hours
    UPDATE multipart_uploads
    SET status = 'aborted'
    WHERE status = 'active'
        AND created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 **Integration with Existing Systems**

### **Update AudioHistory Model Integration**

```sql
-- Update audio_history table to reference file_storage
ALTER TABLE audio_history ADD COLUMN IF NOT EXISTS file_storage_id UUID REFERENCES file_storage(id);
ALTER TABLE audio_history ADD COLUMN IF NOT EXISTS cdn_url VARCHAR(1000);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audio_history_file_storage ON audio_history(file_storage_id);

-- Update function to link audio processing with file storage
CREATE OR REPLACE FUNCTION link_audio_history_to_storage(
    audio_history_uuid UUID,
    file_storage_uuid UUID
)
RETURNS VOID AS $$
DECLARE
    storage_record RECORD;
BEGIN
    -- Get storage record
    SELECT fs.*, sp.cdn_endpoint
    INTO storage_record
    FROM file_storage fs
    JOIN storage_providers sp ON fs.storage_provider_id = sp.id
    WHERE fs.id = file_storage_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'File storage record not found: %', file_storage_uuid;
    END IF;
    
    -- Update audio history with storage information
    UPDATE audio_history
    SET 
        file_storage_id = file_storage_uuid,
        audio_url = storage_record.storage_url,
        cdn_url = storage_record.cdn_url,
        file_size_bytes = storage_record.file_size
    WHERE id = audio_history_uuid;
    
    -- Update file storage status
    UPDATE file_storage
    SET status = 'processed'
    WHERE id = file_storage_uuid;
END;
$$ LANGUAGE plpgsql;
```

### **Enhanced Audio Upload Table**

```sql
-- Update audio_uploads table to use DigitalOcean Spaces
ALTER TABLE audio_uploads ADD COLUMN IF NOT EXISTS file_storage_id UUID REFERENCES file_storage(id);
ALTER TABLE audio_uploads ADD COLUMN IF NOT EXISTS multipart_session_id VARCHAR(255);

-- Create trigger to automatically create file storage records
CREATE OR REPLACE FUNCTION trigger_create_file_storage_for_upload()
RETURNS TRIGGER AS $$
DECLARE
    storage_id UUID;
    storage_path TEXT;
    upload_url TEXT;
    upload_method VARCHAR(50);
    session_id VARCHAR(255);
BEGIN
    -- Create file storage record for the upload
    SELECT * INTO storage_id, storage_path, upload_url, upload_method, session_id
    FROM initiate_file_storage(
        NEW.original_filename,
        NEW.file_size,
        NEW.mime_type,
        'audio_file',
        NEW.user_id,
        NEW.workspace_id
    );
    
    -- Update the upload record with storage information
    NEW.file_storage_id := storage_id;
    NEW.multipart_session_id := session_id;
    NEW.storage_path := storage_path;
    NEW.storage_url := upload_url;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER audio_upload_create_storage
    BEFORE INSERT ON audio_uploads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_file_storage_for_upload();
```

---

## 📊 **Storage Analytics and Monitoring**

### **Storage Performance Dashboard**

```sql
-- Comprehensive storage analytics view
CREATE OR REPLACE VIEW storage_performance_dashboard AS
SELECT 
    sp.provider_name,
    sp.region,
    sp.bucket_name,
    
    -- Storage Metrics (Current Month)
    COUNT(fs.id) as total_files,
    SUM(fs.file_size) as total_size_bytes,
    SUM(fs.file_size) / (1024.0 * 1024.0 * 1024.0) as total_size_gb,
    
    -- File Type Breakdown
    COUNT(fs.id) FILTER (WHERE fs.content_type = 'audio_file') as audio_files,
    SUM(fs.file_size) FILTER (WHERE fs.content_type = 'audio_file') as audio_size_bytes,
    COUNT(fs.id) FILTER (WHERE fs.content_type = 'export_file') as export_files,
    SUM(fs.file_size) FILTER (WHERE fs.content_type = 'export_file') as export_size_bytes,
    
    -- Performance Metrics
    AVG(so.duration_ms) FILTER (WHERE so.operation_type = 'upload') as avg_upload_time_ms,
    AVG(so.duration_ms) FILTER (WHERE so.operation_type = 'download') as avg_download_time_ms,
    
    -- Success Rates
    (COUNT(so.id) FILTER (WHERE so.success = true)::FLOAT / NULLIF(COUNT(so.id), 0)) * 100 as success_rate,
    
    -- Activity Metrics
    COUNT(fs.id) FILTER (WHERE fs.created_at >= CURRENT_DATE - INTERVAL '24 hours') as files_uploaded_24h,
    SUM(fs.download_count) as total_downloads,
    MAX(fs.last_accessed_at) as last_access,
    
    -- Cost Estimation (approximate)
    (SUM(fs.file_size) / (1024.0 * 1024.0 * 1024.0)) * 0.02 as estimated_monthly_storage_cost_usd,
    
    -- Current period
    DATE_TRUNC('month', CURRENT_DATE) as period_start
    
FROM storage_providers sp
LEFT JOIN file_storage fs ON sp.id = fs.storage_provider_id 
    AND fs.status IN ('stored', 'processed') 
    AND fs.deleted_at IS NULL
    AND fs.created_at >= DATE_TRUNC('month', CURRENT_DATE)
LEFT JOIN spaces_operations so ON fs.id = so.file_storage_id 
    AND so.started_at >= DATE_TRUNC('month', CURRENT_DATE)
WHERE sp.is_active = true
GROUP BY sp.id, sp.provider_name, sp.region, sp.bucket_name
ORDER BY total_size_bytes DESC;

-- Storage usage by workspace view
CREATE OR REPLACE VIEW workspace_storage_usage AS
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    
    -- Current Usage
    su.total_files,
    su.total_size_bytes,
    su.total_size_bytes / (1024.0 * 1024.0) as total_size_mb,
    su.audio_files_count,
    su.export_files_count,
    
    -- Quota Information
    sq.max_storage_bytes,
    sq.max_file_count,
    sq.max_storage_bytes / (1024.0 * 1024.0) as max_storage_mb,
    
    -- Usage Percentages
    (su.total_size_bytes::FLOAT / NULLIF(sq.max_storage_bytes, 0)) * 100 as storage_usage_percent,
    (su.total_files::FLOAT / NULLIF(sq.max_file_count, 0)) * 100 as file_count_usage_percent,
    
    -- Growth Metrics
    su.calculated_at as last_calculated,
    
    -- Status Indicators
    CASE 
        WHEN su.total_size_bytes > sq.max_storage_bytes THEN 'over_quota'
        WHEN (su.total_size_bytes::FLOAT / NULLIF(sq.max_storage_bytes, 0)) > 0.9 THEN 'warning'
        WHEN (su.total_size_bytes::FLOAT / NULLIF(sq.max_storage_bytes, 0)) > 0.8 THEN 'high'
        ELSE 'normal'
    END as usage_status
    
FROM workspaces w
LEFT JOIN storage_usage su ON w.id = su.workspace_id AND su.is_current_period = true
LEFT JOIN storage_quotas sq ON w.id = sq.workspace_id
WHERE w.is_active = true
ORDER BY storage_usage_percent DESC NULLS LAST;
```

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Core Infrastructure (Week 1)**
1. **Set up DigitalOcean Spaces** - Create buckets and configure CDN
2. **Deploy storage database schema** - All storage management tables
3. **Configure provider settings** - API keys and endpoint configuration
4. **Implement basic file upload** - Direct upload functionality

### **Phase 2: Advanced Upload Features (Week 2)**
5. **Multipart upload system** - Large file upload support
6. **Chunk management** - Resume and retry functionality
7. **Storage usage tracking** - Real-time usage monitoring
8. **Integration with audio processing** - Link uploads to processing pipeline

### **Phase 3: Performance and Analytics (Week 3)**
9. **CDN optimization** - Cache headers and performance tuning
10. **Storage analytics** - Usage dashboard and monitoring
11. **Cleanup automation** - Lifecycle management and expired file cleanup
12. **Performance monitoring** - Upload/download speed tracking

### **Phase 4: Enterprise Features (Week 4)**
13. **Multi-region support** - Geographic distribution options
14. **Backup and archival** - Automated backup to secondary bucket
15. **Advanced security** - Signed URLs and access control
16. **Cost optimization** - Storage tier management and optimization

---

## 🔒 **Security and Best Practices**

### **Access Control**
- **IAM Configuration** - Minimal permissions for DigitalOcean Spaces API keys
- **Signed URLs** - Time-limited access for file downloads
- **CORS Configuration** - Proper cross-origin resource sharing setup
- **Bucket Policies** - Secure access policies for different file types

### **Data Protection**
- **Encryption at Rest** - DigitalOcean Spaces provides automatic encryption
- **Encryption in Transit** - HTTPS for all file transfers
- **Backup Strategy** - Automated backups to secondary bucket
- **Versioning** - Optional file versioning for critical data

### **Performance Optimization**
- **CDN Configuration** - Global edge caching for fast delivery
- **Compression** - Automatic compression for supported file types
- **Parallel Uploads** - Multipart uploads for large files
- **Cache Headers** - Optimal cache settings for different content types

### **Cost Management**
- **Storage Lifecycle** - Automatic cleanup of temporary and expired files
- **Usage Monitoring** - Real-time tracking of storage costs
- **Optimization Alerts** - Notifications for unusual usage patterns
- **Tier Management** - Appropriate storage classes for different use cases

This comprehensive DigitalOcean Spaces integration provides AudioTricks with enterprise-grade file storage capabilities, ensuring high performance, reliability, and scalability for all audio content and user-generated files.