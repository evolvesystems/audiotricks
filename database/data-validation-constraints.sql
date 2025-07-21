-- AudioTricks Data Validation Constraints and Business Rules
-- This file contains CHECK constraints, validation rules, and business logic enforcement

-- =======================================================
-- FINANCIAL DATA VALIDATION
-- =======================================================

-- Billing records must have positive amounts
ALTER TABLE billing_records 
ADD CONSTRAINT chk_billing_positive_amounts 
CHECK (
    subtotal >= 0 AND 
    total_amount >= 0 AND 
    tax_amount >= 0 AND
    discount_amount >= 0
);

-- Total amount should equal subtotal + tax - discount
ALTER TABLE billing_records 
ADD CONSTRAINT chk_billing_amount_calculation 
CHECK (
    ABS(total_amount - (subtotal + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0))) < 0.01
);

-- Subscription plans must have valid pricing
ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_pricing 
CHECK (
    price >= 0 AND
    setup_fee >= 0 AND
    cancellation_fee >= 0
);

-- Usage pricing tiers must have logical tier boundaries
ALTER TABLE usage_pricing_tiers 
ADD CONSTRAINT chk_pricing_tier_logic 
CHECK (
    tier_start >= 0 AND
    (tier_end IS NULL OR tier_end > tier_start) AND
    unit_price >= 0
);

-- =======================================================
-- USAGE AND QUOTA VALIDATION
-- =======================================================

-- Usage metrics must have non-negative values
ALTER TABLE usage_metrics 
ADD CONSTRAINT chk_usage_positive 
CHECK (
    quantity >= 0 AND
    cost >= 0
);

-- User quotas must have logical limits
ALTER TABLE user_quotas 
ADD CONSTRAINT chk_user_quota_limits 
CHECK (
    api_calls_used >= 0 AND
    api_calls_limit > 0 AND
    tokens_used >= 0 AND
    tokens_limit > 0 AND
    storage_used_mb >= 0 AND
    storage_limit_mb > 0 AND
    processing_minutes_used >= 0 AND
    processing_minutes_limit > 0 AND
    overage_rate >= 0
);

-- User quotas usage should not exceed limits (with tolerance for overages)
ALTER TABLE user_quotas 
ADD CONSTRAINT chk_user_quota_usage 
CHECK (
    (allow_overages = true) OR (
        api_calls_used <= api_calls_limit AND
        tokens_used <= tokens_limit AND
        storage_used_mb <= storage_limit_mb AND
        processing_minutes_used <= processing_minutes_limit
    )
);

-- Storage quotas must have valid values
ALTER TABLE storage_quotas 
ADD CONSTRAINT chk_storage_quota_values 
CHECK (
    max_storage_bytes > 0 AND
    max_file_count > 0 AND
    max_file_size > 0 AND
    current_storage_bytes >= 0 AND
    current_file_count >= 0 AND
    monthly_uploads >= 0 AND
    monthly_upload_bytes >= 0 AND
    retention_days > 0
);

-- Current storage should not exceed max (with small tolerance)
ALTER TABLE storage_quotas 
ADD CONSTRAINT chk_storage_within_limits 
CHECK (
    current_storage_bytes <= max_storage_bytes * 1.1 AND -- 10% tolerance
    current_file_count <= max_file_count * 1.1
);

-- =======================================================
-- FILE AND AUDIO VALIDATION
-- =======================================================

-- Audio uploads must have valid file properties
ALTER TABLE audio_uploads 
ADD CONSTRAINT chk_audio_file_properties 
CHECK (
    file_size > 0 AND
    (duration IS NULL OR duration > 0) AND
    (sample_rate IS NULL OR sample_rate > 0) AND
    (channels IS NULL OR channels > 0) AND
    (bitrate IS NULL OR bitrate > 0) AND
    (original_size IS NULL OR original_size > 0) AND
    (compressed_size IS NULL OR compressed_size > 0)
);

-- Compressed size should be less than or equal to original size
ALTER TABLE audio_uploads 
ADD CONSTRAINT chk_compression_logic 
CHECK (
    (compressed_size IS NULL) OR 
    (original_size IS NULL) OR 
    (compressed_size <= original_size)
);

-- Audio segments must have valid time boundaries
ALTER TABLE audio_segments 
ADD CONSTRAINT chk_segment_time_boundaries 
CHECK (
    start_time >= 0 AND
    end_time > start_time AND
    (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)) AND
    (avg_logprob IS NULL OR avg_logprob <= 0) AND
    (compression_ratio IS NULL OR compression_ratio > 0) AND
    (no_speech_prob IS NULL OR (no_speech_prob >= 0 AND no_speech_prob <= 1))
);

-- Audio chunks must have logical properties
ALTER TABLE audio_chunks 
ADD CONSTRAINT chk_chunk_properties 
CHECK (
    chunk_index >= 0 AND
    start_time >= 0 AND
    end_time > start_time AND
    file_size > 0
);

-- =======================================================
-- USER AND WORKSPACE VALIDATION
-- =======================================================

-- User emails must be properly formatted
ALTER TABLE users 
ADD CONSTRAINT chk_user_email_format 
CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- User role must be valid
ALTER TABLE users 
ADD CONSTRAINT chk_user_role_valid 
CHECK (
    role IN ('user', 'admin', 'superadmin')
);

-- Workspace slug must be URL-friendly
ALTER TABLE workspaces 
ADD CONSTRAINT chk_workspace_slug_format 
CHECK (
    slug ~ '^[a-z0-9-]+$' AND
    length(slug) >= 3 AND
    length(slug) <= 63
);

-- Workspace user role must be valid
ALTER TABLE workspace_users 
ADD CONSTRAINT chk_workspace_user_role 
CHECK (
    role IN ('member', 'admin', 'owner')
);

-- =======================================================
-- SUBSCRIPTION AND BILLING VALIDATION
-- =======================================================

-- Subscription status must be valid
ALTER TABLE workspace_subscriptions 
ADD CONSTRAINT chk_subscription_status 
CHECK (
    status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')
);

-- Billing intervals must be valid
ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_billing_interval 
CHECK (
    billing_interval IN ('monthly', 'yearly', 'usage_based')
);

-- Failed payment count should be reasonable
ALTER TABLE workspace_subscriptions 
ADD CONSTRAINT chk_failed_payment_count 
CHECK (
    failed_payment_count >= 0 AND
    failed_payment_count <= 10 -- Reasonable upper limit
);

-- Subscription change types must be valid
ALTER TABLE subscription_changes 
ADD CONSTRAINT chk_change_type_valid 
CHECK (
    change_type IN ('upgrade', 'downgrade', 'cancel', 'reactivate', 'plan_change')
);

-- =======================================================
-- PROCESSING AND JOB VALIDATION
-- =======================================================

-- Processing jobs must have valid status
ALTER TABLE processing_jobs 
ADD CONSTRAINT chk_processing_job_status 
CHECK (
    status IN ('queued', 'running', 'completed', 'failed', 'cancelled')
);

-- Processing job type must be valid
ALTER TABLE processing_jobs 
ADD CONSTRAINT chk_processing_job_type 
CHECK (
    job_type IN ('transcription', 'summarization', 'voice_synthesis', 'analysis', 'export')
);

-- Priority must be within valid range
ALTER TABLE processing_jobs 
ADD CONSTRAINT chk_processing_priority 
CHECK (
    priority >= 1 AND priority <= 10
);

-- Retry count should be reasonable
ALTER TABLE processing_jobs 
ADD CONSTRAINT chk_retry_count_limit 
CHECK (
    retry_count >= 0 AND
    retry_count <= max_retries AND
    max_retries <= 10
);

-- Execution duration should be positive when completed
ALTER TABLE processing_jobs 
ADD CONSTRAINT chk_execution_duration 
CHECK (
    (execution_status != 'success') OR 
    (execution_duration_ms IS NOT NULL AND execution_duration_ms > 0)
);

-- =======================================================
-- SECURITY AND AUDIT VALIDATION
-- =======================================================

-- Audit log actions must be valid
ALTER TABLE audit_logs 
ADD CONSTRAINT chk_audit_action_valid 
CHECK (
    action IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'access')
);

-- Audit log categories must be valid
ALTER TABLE audit_logs 
ADD CONSTRAINT chk_audit_category_valid 
CHECK (
    category IN ('security', 'data', 'system', 'user_action', 'admin_action', 'billing')
);

-- Audit log severity must be valid
ALTER TABLE audit_logs 
ADD CONSTRAINT chk_audit_severity_valid 
CHECK (
    severity IN ('debug', 'info', 'warn', 'error', 'critical')
);

-- Audit log outcome must be valid
ALTER TABLE audit_logs 
ADD CONSTRAINT chk_audit_outcome_valid 
CHECK (
    outcome IN ('success', 'failure', 'partial')
);

-- Security event threat levels must be valid
ALTER TABLE security_events 
ADD CONSTRAINT chk_security_threat_level 
CHECK (
    threat_level IN ('low', 'medium', 'high', 'critical')
);

-- Security event types must be valid
ALTER TABLE security_events 
ADD CONSTRAINT chk_security_event_type 
CHECK (
    event_type IN (
        'failed_login', 'account_locked', 'suspicious_activity', 
        'brute_force_login', 'unusual_location_login', 'unusual_time_login',
        'mass_data_exfiltration', 'api_abuse', 'unauthorized_access'
    )
);

-- =======================================================
-- API KEY MANAGEMENT VALIDATION
-- =======================================================

-- API key providers must be valid
ALTER TABLE api_key_management 
ADD CONSTRAINT chk_api_provider_valid 
CHECK (
    provider IN ('openai', 'elevenlabs', 'azure', 'google', 'anthropic')
);

-- API key usage stats should be non-negative
ALTER TABLE api_key_management 
ADD CONSTRAINT chk_api_key_stats 
CHECK (
    total_requests >= 0 AND
    successful_requests >= 0 AND
    failed_requests >= 0 AND
    total_cost >= 0 AND
    successful_requests <= total_requests AND
    failed_requests <= total_requests
);

-- =======================================================
-- DATA RETENTION AND COMPLIANCE VALIDATION
-- =======================================================

-- Data retention periods must be positive
ALTER TABLE data_retention_policies 
ADD CONSTRAINT chk_retention_period_positive 
CHECK (
    retention_period_days > 0 AND
    (minimum_retention_days IS NULL OR minimum_retention_days > 0) AND
    (notify_before_deletion_days IS NULL OR notify_before_deletion_days >= 0)
);

-- Retention policy consistency
ALTER TABLE data_retention_policies 
ADD CONSTRAINT chk_retention_policy_logic 
CHECK (
    (minimum_retention_days IS NULL) OR 
    (retention_period_days >= minimum_retention_days)
);

-- Export history status must be valid
ALTER TABLE export_history 
ADD CONSTRAINT chk_export_status_valid 
CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'expired')
);

-- Export types must be valid
ALTER TABLE export_history 
ADD CONSTRAINT chk_export_type_valid 
CHECK (
    export_type IN ('json', 'csv', 'pdf', 'zip', 'gdpr_package')
);

-- =======================================================
-- ALERT AND NOTIFICATION VALIDATION
-- =======================================================

-- Alert rule threshold types must be valid
ALTER TABLE alert_rules 
ADD CONSTRAINT chk_alert_threshold_type 
CHECK (
    threshold_type IN ('absolute', 'percentage')
);

-- Alert rule comparison operators must be valid
ALTER TABLE alert_rules 
ADD CONSTRAINT chk_alert_comparison_operator 
CHECK (
    comparison_operator IN ('>', '>=', '<', '<=', '=', '!=')
);

-- Alert rule metric types must be valid
ALTER TABLE alert_rules 
ADD CONSTRAINT chk_alert_metric_type 
CHECK (
    metric_type IN (
        'api_calls', 'tokens', 'storage_mb', 'processing_minutes', 
        'monthly_cost', 'error_rate', 'response_time'
    )
);

-- Threshold values must be positive
ALTER TABLE alert_rules 
ADD CONSTRAINT chk_alert_threshold_positive 
CHECK (
    threshold_value > 0
);

-- Percentage thresholds should be between 0 and 100
ALTER TABLE alert_rules 
ADD CONSTRAINT chk_alert_percentage_range 
CHECK (
    (threshold_type != 'percentage') OR 
    (threshold_value > 0 AND threshold_value <= 100)
);

-- =======================================================
-- BUSINESS LOGIC VALIDATION FUNCTIONS
-- =======================================================

-- Function to validate subscription plan limits
CREATE OR REPLACE FUNCTION validate_subscription_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure unlimited values are properly set
    IF NEW.max_workspaces = -1 THEN
        NEW.max_workspaces := 2147483647; -- Max integer
    END IF;
    
    IF NEW.max_users = -1 THEN
        NEW.max_users := 2147483647; -- Max integer
    END IF;
    
    -- Validate feature consistency
    IF NEW.price = 0 AND array_length(NEW.features, 1) > 3 THEN
        RAISE EXCEPTION 'Free plans cannot have more than 3 features';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_subscription_plan
    BEFORE INSERT OR UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION validate_subscription_plan_limits();

-- Function to validate workspace subscription changes
CREATE OR REPLACE FUNCTION validate_subscription_change()
RETURNS TRIGGER AS $$
DECLARE
    current_plan subscription_plans%ROWTYPE;
    new_plan subscription_plans%ROWTYPE;
BEGIN
    -- Get plan details
    SELECT * INTO current_plan FROM subscription_plans WHERE id = OLD.plan_id;
    SELECT * INTO new_plan FROM subscription_plans WHERE id = NEW.plan_id;
    
    -- Prevent downgrade if current usage exceeds new plan limits
    IF new_plan.max_storage_mb < current_plan.max_storage_mb THEN
        IF EXISTS (
            SELECT 1 FROM storage_quotas 
            WHERE workspace_id = NEW.workspace_id 
            AND current_storage_bytes > (new_plan.max_storage_mb * 1024 * 1024)
        ) THEN
            RAISE EXCEPTION 'Cannot downgrade: current storage usage exceeds new plan limits';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_subscription_change
    BEFORE UPDATE ON workspace_subscriptions
    FOR EACH ROW
    WHEN (OLD.plan_id IS DISTINCT FROM NEW.plan_id)
    EXECUTE FUNCTION validate_subscription_change();

-- Function to validate file upload against quotas
CREATE OR REPLACE FUNCTION validate_file_upload()
RETURNS TRIGGER AS $$
DECLARE
    quota storage_quotas%ROWTYPE;
BEGIN
    SELECT * INTO quota FROM storage_quotas WHERE workspace_id = NEW.workspace_id;
    
    IF FOUND THEN
        -- Check file size limit
        IF NEW.file_size > quota.max_file_size THEN
            RAISE EXCEPTION 'File size % exceeds limit of %', NEW.file_size, quota.max_file_size;
        END IF;
        
        -- Check storage limit
        IF (quota.current_storage_bytes + NEW.file_size) > quota.max_storage_bytes THEN
            RAISE EXCEPTION 'Upload would exceed storage quota';
        END IF;
        
        -- Check file count limit
        IF (quota.current_file_count + 1) > quota.max_file_count THEN
            RAISE EXCEPTION 'Upload would exceed file count limit';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_file_upload
    BEFORE INSERT ON audio_uploads
    FOR EACH ROW
    EXECUTE FUNCTION validate_file_upload();

-- =======================================================
-- MONITORING VIEWS FOR CONSTRAINT VIOLATIONS
-- =======================================================

-- View to monitor quota violations
CREATE OR REPLACE VIEW quota_violations AS
SELECT 
    'user_quota' as violation_type,
    uq.user_id as entity_id,
    u.username as entity_name,
    CASE 
        WHEN uq.api_calls_used > uq.api_calls_limit THEN 'API calls exceeded'
        WHEN uq.tokens_used > uq.tokens_limit THEN 'Token limit exceeded'
        WHEN uq.storage_used_mb > uq.storage_limit_mb THEN 'Storage limit exceeded'
        WHEN uq.processing_minutes_used > uq.processing_minutes_limit THEN 'Processing minutes exceeded'
    END as violation_description,
    CURRENT_TIMESTAMP as detected_at
FROM user_quotas uq
JOIN users u ON uq.user_id = u.id
WHERE (
    uq.api_calls_used > uq.api_calls_limit OR
    uq.tokens_used > uq.tokens_limit OR
    uq.storage_used_mb > uq.storage_limit_mb OR
    uq.processing_minutes_used > uq.processing_minutes_limit
) AND uq.allow_overages = false

UNION ALL

SELECT 
    'storage_quota' as violation_type,
    sq.workspace_id as entity_id,
    w.name as entity_name,
    CASE 
        WHEN sq.current_storage_bytes > sq.max_storage_bytes THEN 'Storage limit exceeded'
        WHEN sq.current_file_count > sq.max_file_count THEN 'File count limit exceeded'
    END as violation_description,
    CURRENT_TIMESTAMP as detected_at
FROM storage_quotas sq
JOIN workspaces w ON sq.workspace_id = w.id
WHERE (
    sq.current_storage_bytes > sq.max_storage_bytes OR
    sq.current_file_count > sq.max_file_count
);

-- View to monitor billing inconsistencies
CREATE OR REPLACE VIEW billing_inconsistencies AS
SELECT 
    br.id,
    br.invoice_number,
    br.subtotal,
    br.tax_amount,
    br.discount_amount,
    br.total_amount,
    (br.subtotal + COALESCE(br.tax_amount, 0) - COALESCE(br.discount_amount, 0)) as calculated_total,
    ABS(br.total_amount - (br.subtotal + COALESCE(br.tax_amount, 0) - COALESCE(br.discount_amount, 0))) as discrepancy
FROM billing_records br
WHERE ABS(br.total_amount - (br.subtotal + COALESCE(br.tax_amount, 0) - COALESCE(br.discount_amount, 0))) > 0.01;

RAISE NOTICE 'Data validation constraints and business rules installed successfully!';
RAISE NOTICE 'Added constraints for:';
RAISE NOTICE '- Financial data validation';
RAISE NOTICE '- Usage and quota enforcement';
RAISE NOTICE '- File and audio validation';
RAISE NOTICE '- User and workspace data integrity';
RAISE NOTICE '- Security and audit trail validation';
RAISE NOTICE '- Business logic enforcement triggers';
RAISE NOTICE 'Monitoring views created for constraint violations and inconsistencies';