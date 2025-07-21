-- AudioTricks Database Initialization Script
-- This script sets up the initial database structure and default data

-- Ensure the database exists and is properly configured
SELECT 'Starting AudioTricks database initialization...' as status;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create indexes for better performance (these should match your Prisma schema)
-- Note: Prisma will handle most of this, but these are backup/optimization indexes

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Workspaces table indexes  
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at);

-- Uploads table indexes
CREATE INDEX IF NOT EXISTS idx_uploads_workspace_id ON uploads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at);

-- Processing_jobs table indexes
CREATE INDEX IF NOT EXISTS idx_processing_jobs_upload_id ON processing_jobs(upload_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at);

-- Api_keys table indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);

-- Usage_records table indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_workspace_id ON usage_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_resource_type ON usage_records(resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at);

-- Workspace_members table indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace_id ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Insert default data
INSERT INTO plan_limits (plan, storage_gb, processing_minutes, api_calls_per_month, transcription_minutes, ai_tokens_per_month)
VALUES 
  ('free', 1, 60, 1000, 30, 50000),
  ('pro', 50, 600, 10000, 300, 500000),
  ('enterprise', 500, 6000, 100000, 3000, 5000000)
ON CONFLICT (plan) DO NOTHING;

SELECT 'AudioTricks database initialization completed successfully!' as status;