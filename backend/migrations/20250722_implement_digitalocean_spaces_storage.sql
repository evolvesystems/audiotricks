-- DigitalOcean Spaces Storage Integration Migration
-- Implements complete storage management system with CDN support

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

-- Integration with existing audio tables
ALTER TABLE audio_history ADD COLUMN IF NOT EXISTS file_storage_id UUID REFERENCES file_storage(id);
ALTER TABLE audio_history ADD COLUMN IF NOT EXISTS cdn_url VARCHAR(1000);
CREATE INDEX IF NOT EXISTS idx_audio_history_file_storage ON audio_history(file_storage_id);

ALTER TABLE audio_uploads ADD COLUMN IF NOT EXISTS file_storage_id UUID REFERENCES file_storage(id);
ALTER TABLE audio_uploads ADD COLUMN IF NOT EXISTS multipart_session_id VARCHAR(255);

-- Insert default DigitalOcean Spaces configuration
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
    is_active,
    max_file_size,
    allowed_file_types
) VALUES (
    'digitalocean_spaces',
    'object_storage',
    'audiotricks-production.nyc3.digitaloceanspaces.com',
    'nyc3',
    'audiotricks-production',
    'cdn.audiotricks.com',
    true,
    'PLACEHOLDER_ACCESS_KEY', -- Replace with actual access key
    'PLACEHOLDER_ENCRYPTED_SECRET', -- Replace with encrypted secret
    true,
    true,
    5368709120, -- 5GB
    ARRAY['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus', 'mp4', 'mov', 'avi']
) ON CONFLICT (is_primary) WHERE is_primary = true DO NOTHING;

-- Storage performance dashboard view
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

-- Workspace storage usage view
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
    sq.total_bytes as max_storage_bytes,
    sq.file_count as max_file_count,
    sq.total_bytes / (1024.0 * 1024.0) as max_storage_mb,
    
    -- Usage Percentages
    (su.total_size_bytes::FLOAT / NULLIF(sq.total_bytes, 0)) * 100 as storage_usage_percent,
    (su.total_files::FLOAT / NULLIF(sq.file_count, 0)) * 100 as file_count_usage_percent,
    
    -- Growth Metrics
    su.calculated_at as last_calculated,
    
    -- Status Indicators
    CASE 
        WHEN su.total_size_bytes > sq.total_bytes THEN 'over_quota'
        WHEN (su.total_size_bytes::FLOAT / NULLIF(sq.total_bytes, 0)) > 0.9 THEN 'warning'
        WHEN (su.total_size_bytes::FLOAT / NULLIF(sq.total_bytes, 0)) > 0.8 THEN 'high'
        ELSE 'normal'
    END as usage_status
    
FROM workspaces w
LEFT JOIN storage_usage su ON w.id = su.workspace_id AND su.is_current_period = true
LEFT JOIN storage_quotas sq ON w.id = sq.workspace_id
WHERE w.is_active = true
ORDER BY storage_usage_percent DESC NULLS LAST;