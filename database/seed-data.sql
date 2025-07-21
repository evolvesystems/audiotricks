-- AudioTricks Database Seed Data
-- This file contains initial data for the enhanced AudioTricks database schema

-- =======================================================
-- SUBSCRIPTION PLANS
-- =======================================================

INSERT INTO subscription_plans (
    id, name, description, plan_code, price, currency, billing_interval,
    max_api_calls, max_tokens, max_storage_mb, max_processing_min,
    max_workspaces, max_users, max_file_size, features, is_active, is_public, sort_order
) VALUES 
-- Free Tier
(
    gen_random_uuid(),
    'Free',
    'Get started with basic audio transcription and summarization',
    'free',
    0.00,
    'USD',
    'monthly',
    100,        -- 100 API calls per month
    10000,      -- 10K tokens per month
    100,        -- 100MB storage
    30,         -- 30 minutes processing per month
    1,          -- 1 workspace
    3,          -- 3 users
    26214400,   -- 25MB max file size
    ARRAY['basic_transcription', 'basic_summarization', 'email_support'],
    true,
    true,
    1
),
-- Starter Plan
(
    gen_random_uuid(),
    'Starter',
    'Perfect for individuals and small projects',
    'starter_monthly',
    9.99,
    'USD',
    'monthly',
    1000,       -- 1K API calls per month
    50000,      -- 50K tokens per month
    1024,       -- 1GB storage
    120,        -- 2 hours processing per month
    1,          -- 1 workspace
    5,          -- 5 users
    52428800,   -- 50MB max file size
    ARRAY['basic_transcription', 'advanced_summarization', 'voice_synthesis', 'export_features', 'email_support'],
    true,
    true,
    2
),
-- Professional Plan
(
    gen_random_uuid(),
    'Professional',
    'Ideal for growing teams and businesses',
    'pro_monthly',
    29.99,
    'USD',
    'monthly',
    10000,      -- 10K API calls per month
    500000,     -- 500K tokens per month
    10240,      -- 10GB storage
    600,        -- 10 hours processing per month
    5,          -- 5 workspaces
    25,         -- 25 users
    157286400,  -- 150MB max file size
    ARRAY['advanced_transcription', 'advanced_summarization', 'voice_synthesis', 'analytics', 'api_access', 'priority_processing', 'chat_support'],
    true,
    true,
    3
),
-- Team Plan
(
    gen_random_uuid(),
    'Team',
    'Collaboration features for larger teams',
    'team_monthly',
    59.99,
    'USD',
    'monthly',
    25000,      -- 25K API calls per month
    1000000,    -- 1M tokens per month
    51200,      -- 50GB storage
    1200,       -- 20 hours processing per month
    10,         -- 10 workspaces
    100,        -- 100 users
    314572800,  -- 300MB max file size
    ARRAY['advanced_transcription', 'advanced_summarization', 'voice_synthesis', 'analytics', 'api_access', 'priority_processing', 'collaboration_tools', 'webhook_integrations', 'chat_support'],
    true,
    true,
    4
),
-- Enterprise Plan
(
    gen_random_uuid(),
    'Enterprise',
    'For large organizations with advanced needs',
    'enterprise_monthly',
    199.99,
    'USD',
    'monthly',
    100000,     -- 100K API calls per month
    5000000,    -- 5M tokens per month
    204800,     -- 200GB storage
    6000,       -- 100 hours processing per month
    -1,         -- Unlimited workspaces
    -1,         -- Unlimited users
    1073741824, -- 1GB max file size
    ARRAY['all_features', 'priority_support', 'white_label', 'api_access', 'advanced_analytics', 'custom_integrations', 'sla_guarantee', 'dedicated_support'],
    true,
    true,
    5
);

-- =======================================================
-- USAGE PRICING TIERS
-- =======================================================

-- Professional Plan Overage Pricing
WITH pro_plan AS (SELECT id FROM subscription_plans WHERE plan_code = 'pro_monthly')
INSERT INTO usage_pricing_tiers (plan_id, usage_type, tier_start, tier_end, unit_price, billing_unit) 
SELECT 
    pro_plan.id,
    unnest(ARRAY['api_calls', 'api_calls', 'api_calls']) as usage_type,
    unnest(ARRAY[0, 10000, 50000]::BIGINT[]) as tier_start,
    unnest(ARRAY[10000, 50000, NULL]::BIGINT[]) as tier_end,
    unnest(ARRAY[0.001, 0.0008, 0.0005]::DECIMAL[]) as unit_price,
    'unit' as billing_unit
FROM pro_plan;

-- Token pricing for Professional Plan
WITH pro_plan AS (SELECT id FROM subscription_plans WHERE plan_code = 'pro_monthly')
INSERT INTO usage_pricing_tiers (plan_id, usage_type, tier_start, tier_end, unit_price, billing_unit)
SELECT 
    pro_plan.id,
    unnest(ARRAY['tokens', 'tokens', 'tokens']) as usage_type,
    unnest(ARRAY[0, 100000, 1000000]::BIGINT[]) as tier_start,
    unnest(ARRAY[100000, 1000000, NULL]::BIGINT[]) as tier_end,
    unnest(ARRAY[0.00002, 0.000015, 0.00001]::DECIMAL[]) as unit_price,
    'unit' as billing_unit
FROM pro_plan;

-- =======================================================
-- DATA RETENTION POLICIES
-- =======================================================

INSERT INTO data_retention_policies (
    policy_name, description, data_type, retention_days, auto_delete, 
    archive_before_delete, is_active
) VALUES 
-- User generated content
(
    'User Audio Files - Standard Retention',
    'Audio files and transcripts retained for user access and compliance',
    'audio_files',
    2555, -- 7 years
    false, -- Manual review required
    true,
    true
),
-- System logs
(
    'Security Audit Logs',
    'Security events and audit logs for compliance monitoring',
    'security_events',
    2555, -- 7 years for security compliance
    false,
    true,
    true
),
(
    'General Application Logs',
    'Standard application audit logs',
    'audit_logs',
    365, -- 1 year
    true,
    true,
    true
),
(
    'Usage Metrics',
    'Usage tracking data for billing and analytics',
    'usage_metrics',
    1095, -- 3 years for billing compliance
    true,
    true,
    true
),
-- User data
(
    'User Sessions',
    'User login sessions and authentication tokens',
    'sessions',
    30, -- 30 days
    true,
    false,
    true
),
(
    'Processing Cache',
    'Cached processing results for performance optimization',
    'processing_cache',
    90, -- 3 months
    true,
    false,
    true
);

-- =======================================================
-- DEFAULT WORKSPACE SETTINGS
-- =======================================================

-- Create a function to set default workspace settings
CREATE OR REPLACE FUNCTION create_default_workspace_settings(workspace_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO workspace_settings (
        workspace_id,
        default_processing_options,
        allowed_file_types,
        max_file_size,
        max_processing_time,
        allow_public_sharing,
        allow_guest_access,
        require_approval_for_uploads,
        settings_json
    ) VALUES (
        workspace_uuid,
        '{
            "transcription_model": "whisper-1",
            "language": "auto",
            "temperature": 0.3,
            "max_tokens": 2000,
            "summary_style": "formal"
        }'::jsonb,
        ARRAY['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus', 'mp4', 'mov', 'avi'],
        157286400, -- 150MB default
        3600, -- 1 hour default
        false,
        false,
        false,
        '{
            "email_notifications": true,
            "processing_notifications": true,
            "weekly_usage_reports": true
        }'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- SAMPLE PROCESSING TEMPLATES
-- =======================================================

-- Create sample processing templates for different use cases
INSERT INTO processing_templates (
    id, user_id, name, description, summary_style, temperature, max_tokens, 
    language, config_json, is_public
) VALUES 
-- Meeting transcription template
(
    gen_random_uuid(),
    NULL, -- System template, no specific user
    'Meeting Transcription',
    'Optimized for business meetings and calls',
    'formal',
    0.2,
    1500,
    'en',
    '{
        "speaker_identification": true,
        "remove_filler_words": true,
        "add_timestamps": true,
        "summary_sections": ["key_decisions", "action_items", "attendees"],
        "confidence_threshold": 0.8
    }'::jsonb,
    true
),
-- Interview template
(
    gen_random_uuid(),
    NULL,
    'Interview Transcription',
    'Perfect for interviews and podcasts',
    'conversational',
    0.3,
    2000,
    'en',
    '{
        "speaker_identification": true,
        "preserve_speech_patterns": true,
        "add_timestamps": false,
        "summary_sections": ["main_topics", "key_quotes", "insights"],
        "confidence_threshold": 0.7
    }'::jsonb,
    true
),
-- Lecture template
(
    gen_random_uuid(),
    NULL,
    'Educational Content',
    'Designed for lectures and educational content',
    'formal',
    0.2,
    3000,
    'en',
    '{
        "speaker_identification": false,
        "add_timestamps": true,
        "summary_sections": ["main_concepts", "key_takeaways", "additional_resources"],
        "confidence_threshold": 0.9,
        "technical_vocabulary": true
    }'::jsonb,
    true
);

-- =======================================================
-- SAMPLE ALERT RULES
-- =======================================================

-- Create sample alert rules for monitoring
CREATE OR REPLACE FUNCTION create_default_alert_rules(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO alert_rules (
        user_id, rule_name, metric_type, threshold_value, threshold_type,
        comparison_operator, notification_methods, is_active
    ) VALUES 
    -- Quota warnings
    (
        user_uuid,
        'API Quota Warning',
        'api_calls',
        80.0,
        'percentage',
        '>=',
        ARRAY['email'],
        true
    ),
    (
        user_uuid,
        'Token Usage Warning',
        'tokens',
        85.0,
        'percentage',
        '>=',
        ARRAY['email'],
        true
    ),
    (
        user_uuid,
        'Storage Quota Warning',
        'storage_mb',
        90.0,
        'percentage',
        '>=',
        ARRAY['email'],
        true
    ),
    -- Cost alerts
    (
        user_uuid,
        'Monthly Cost Alert',
        'monthly_cost',
        100.0,
        'absolute',
        '>=',
        ARRAY['email'],
        true
    );
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- PERFORMANCE INDEXES
-- =======================================================

-- High-priority performance indexes for frequent queries

-- Usage tracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_user_period 
ON usage_metrics(user_id, period_start DESC, metric_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_workspace_period 
ON usage_metrics(workspace_id, period_start DESC, metric_type) 
WHERE workspace_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_provider_recorded 
ON usage_metrics(provider, recorded_at DESC) 
WHERE provider IS NOT NULL;

-- Audio processing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_uploads_status_created 
ON audio_uploads(status, uploaded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_uploads_user_workspace 
ON audio_uploads(user_id, workspace_id, uploaded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_jobs_status_priority 
ON processing_jobs(status, priority DESC, queued_at ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_segments_history_index 
ON audio_segments(history_id, segment_index);

-- Subscription and billing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_subscriptions_status 
ON workspace_subscriptions(status, current_period_end);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_subscription_date 
ON billing_records(subscription_id, invoice_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_status_due 
ON billing_records(status, due_date) 
WHERE status IN ('open', 'past_due');

-- Audit and security indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_created 
ON audit_logs(action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_created 
ON audit_logs(resource, resource_id, created_at DESC) 
WHERE resource_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_created 
ON security_events(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_type_severity 
ON security_events(event_type, severity, created_at DESC);

-- Data access logging indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_access_logs_user_accessed 
ON data_access_logs(user_id, accessed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_access_logs_resource 
ON data_access_logs(resource_type, resource_id, accessed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_access_logs_pii 
ON data_access_logs(contains_pii, accessed_at DESC) 
WHERE contains_pii = true;

-- Storage and file management indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_storage_quotas_workspace 
ON storage_quotas(workspace_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_chunks_upload_index 
ON audio_chunks(upload_id, chunk_index);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_processing_cache_hash 
ON file_processing_cache(file_hash, processing_options_hash);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_processing_cache_expires 
ON file_processing_cache(expires_at) 
WHERE expires_at IS NOT NULL;

-- User and workspace indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login 
ON users(last_login_at DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_users_workspace_role 
ON workspace_users(workspace_id, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_users_user_active 
ON workspace_users(user_id, last_active_at DESC NULLS LAST);

-- API key management indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_key_management_user_provider 
ON api_key_management(user_id, provider, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_key_management_last_used 
ON api_key_management(last_used_at DESC NULLS LAST) 
WHERE is_active = true;

-- Export and sharing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_history_user_created 
ON export_history(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_history_status 
ON export_history(status, expires_at) 
WHERE expires_at IS NOT NULL;

-- =======================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =======================================================

-- Daily usage summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_usage_summary AS
SELECT 
    user_id,
    workspace_id,
    DATE(recorded_at) as usage_date,
    SUM(CASE WHEN metric_type = 'api_call' THEN quantity ELSE 0 END) as daily_api_calls,
    SUM(CASE WHEN metric_type = 'token_usage' THEN quantity ELSE 0 END) as daily_tokens,
    SUM(CASE WHEN metric_type = 'processing_time' THEN quantity ELSE 0 END) as daily_processing_seconds,
    SUM(cost) as daily_cost,
    COUNT(DISTINCT CASE WHEN metric_type = 'api_call' THEN recorded_at END) as api_call_sessions
FROM usage_metrics
WHERE recorded_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY user_id, workspace_id, DATE(recorded_at);

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_usage_summary_unique 
ON daily_usage_summary(user_id, COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid), usage_date);

-- Monthly subscription metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_subscription_metrics AS
SELECT 
    DATE_TRUNC('month', CURRENT_DATE) as metric_month,
    sp.name as plan_name,
    sp.plan_code,
    COUNT(ws.id) as active_subscriptions,
    SUM(sp.price) as monthly_revenue,
    COUNT(CASE WHEN ws.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_subscriptions,
    COUNT(CASE WHEN ws.cancelled_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as cancelled_subscriptions
FROM workspace_subscriptions ws
JOIN subscription_plans sp ON ws.plan_id = sp.id
WHERE ws.status IN ('active', 'trialing')
    AND ws.current_period_end >= CURRENT_DATE
GROUP BY sp.name, sp.plan_code, sp.price;

-- =======================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- =======================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_subscription_metrics;
    
    -- Log the refresh
    INSERT INTO audit_logs (
        action, resource, category, details
    ) VALUES (
        'refresh',
        'materialized_views',
        'system',
        '{"views": ["daily_usage_summary", "monthly_subscription_metrics"]}'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =======================================================

-- Procedure to update storage usage after file operations
CREATE OR REPLACE FUNCTION update_storage_usage(
    workspace_uuid UUID,
    file_size_delta BIGINT,
    file_count_delta INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO storage_quotas (
        workspace_id, 
        current_storage_bytes, 
        current_file_count,
        max_storage_bytes,
        max_file_count,
        max_file_size
    ) VALUES (
        workspace_uuid,
        GREATEST(0, file_size_delta),
        GREATEST(0, file_count_delta),
        10737418240, -- 10GB default
        1000, -- 1000 files default
        157286400 -- 150MB default max file size
    )
    ON CONFLICT (workspace_id) 
    DO UPDATE SET
        current_storage_bytes = GREATEST(0, storage_quotas.current_storage_bytes + file_size_delta),
        current_file_count = GREATEST(0, storage_quotas.current_file_count + file_count_delta),
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Procedure to record usage metrics
CREATE OR REPLACE FUNCTION record_usage_metric(
    user_uuid UUID,
    workspace_uuid UUID,
    metric_type_val VARCHAR(50),
    provider_val VARCHAR(50),
    quantity_val BIGINT,
    cost_val DECIMAL(10,4),
    metadata_val JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO usage_metrics (
        user_id, workspace_id, metric_type, provider, quantity, cost, metadata,
        period_start, period_end
    ) VALUES (
        user_uuid, workspace_uuid, metric_type_val, provider_val, quantity_val, cost_val, metadata_val,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- INITIAL DATA VALIDATION
-- =======================================================

-- Verify that essential data was inserted correctly
DO $$
DECLARE
    plan_count INTEGER;
    policy_count INTEGER;
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE is_active = true;
    SELECT COUNT(*) INTO policy_count FROM data_retention_policies WHERE is_active = true;
    SELECT COUNT(*) INTO template_count FROM processing_templates WHERE is_public = true;
    
    RAISE NOTICE 'Seed data validation:';
    RAISE NOTICE '- Subscription plans: %', plan_count;
    RAISE NOTICE '- Retention policies: %', policy_count;
    RAISE NOTICE '- Processing templates: %', template_count;
    
    IF plan_count < 3 THEN
        RAISE EXCEPTION 'Insufficient subscription plans created';
    END IF;
    
    IF policy_count < 3 THEN
        RAISE EXCEPTION 'Insufficient retention policies created';
    END IF;
    
    RAISE NOTICE 'Seed data validation completed successfully';
END $$;

-- =======================================================
-- SAMPLE ENVIRONMENT CONFIGURATION
-- =======================================================

-- Create configuration table for environment-specific settings
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration values
INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('app_environment', 'development', 'Application environment (development, staging, production)', false),
('max_file_upload_size', '157286400', 'Maximum file upload size in bytes (150MB)', false),
('default_retention_days', '365', 'Default data retention period in days', false),
('enable_audit_logging', 'true', 'Enable comprehensive audit logging', false),
('enable_security_monitoring', 'true', 'Enable security event monitoring', false),
('analytics_retention_days', '1095', 'Analytics data retention period (3 years)', false),
('session_timeout_minutes', '480', 'User session timeout in minutes (8 hours)', false),
('api_rate_limit_per_minute', '100', 'Default API rate limit per minute', false),
('enable_email_notifications', 'true', 'Enable email notifications', false),
('support_email', 'support@audiotricks.com', 'Support email address', false),
('backup_retention_days', '30', 'Database backup retention period', false)
ON CONFLICT (key) DO NOTHING;

RAISE NOTICE 'AudioTricks database seed data installation completed successfully!';
RAISE NOTICE 'Remember to:';
RAISE NOTICE '1. Update system_config values for your environment';
RAISE NOTICE '2. Set up scheduled jobs for materialized view refreshes';
RAISE NOTICE '3. Configure monitoring for the new indexes';
RAISE NOTICE '4. Test the alert rules and retention policies';