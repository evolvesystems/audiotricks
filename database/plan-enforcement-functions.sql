-- AudioTricks Plan Enforcement and Quota Checking System
-- This file contains all functions for enforcing plan limits and checking quotas in real-time

-- =======================================================
-- QUOTA CHECKING FUNCTIONS
-- =======================================================

-- Function to get current plan limits for a user/workspace
CREATE OR REPLACE FUNCTION get_plan_limits(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    plan_name TEXT,
    max_transcriptions_monthly BIGINT,
    max_files_daily INTEGER,
    max_files_monthly INTEGER,
    max_concurrent_jobs INTEGER,
    max_voice_synthesis_monthly BIGINT,
    max_export_operations_monthly INTEGER,
    max_audio_duration_minutes INTEGER,
    priority_level INTEGER,
    allowed_file_types TEXT[],
    analysis_features TEXT[],
    collaboration_features TEXT[],
    integration_features TEXT[]
) AS $$
DECLARE
    workspace_plan subscription_plans%ROWTYPE;
    user_plan subscription_plans%ROWTYPE;
BEGIN
    -- Get workspace plan if workspace is specified
    IF workspace_uuid IS NOT NULL THEN
        SELECT sp.* INTO workspace_plan
        FROM subscription_plans sp
        JOIN workspace_subscriptions ws ON sp.id = ws.plan_id
        WHERE ws.workspace_id = workspace_uuid AND ws.status = 'active';
        
        IF FOUND THEN
            RETURN QUERY SELECT 
                workspace_plan.name::TEXT,
                workspace_plan.max_transcriptions_monthly,
                workspace_plan.max_files_daily,
                workspace_plan.max_files_monthly,
                workspace_plan.max_concurrent_jobs,
                workspace_plan.max_voice_synthesis_monthly,
                workspace_plan.max_export_operations_monthly,
                workspace_plan.max_audio_duration_minutes,
                workspace_plan.priority_level,
                workspace_plan.allowed_file_types,
                workspace_plan.analysis_features,
                workspace_plan.collaboration_features,
                workspace_plan.integration_features;
            RETURN;
        END IF;
    END IF;
    
    -- Fallback to user's personal plan or free plan
    SELECT sp.* INTO user_plan
    FROM subscription_plans sp
    WHERE sp.plan_code = 'free' AND sp.is_active = true
    LIMIT 1;
    
    RETURN QUERY SELECT 
        user_plan.name::TEXT,
        user_plan.max_transcriptions_monthly,
        user_plan.max_files_daily,
        user_plan.max_files_monthly,
        user_plan.max_concurrent_jobs,
        user_plan.max_voice_synthesis_monthly,
        user_plan.max_export_operations_monthly,
        user_plan.max_audio_duration_minutes,
        user_plan.priority_level,
        user_plan.allowed_file_types,
        user_plan.analysis_features,
        user_plan.collaboration_features,
        user_plan.integration_features;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create usage counter for a specific period
CREATE OR REPLACE FUNCTION get_usage_counter(
    user_uuid UUID,
    workspace_uuid UUID,
    period_type_val VARCHAR(20) DEFAULT 'monthly'
)
RETURNS UUID AS $$
DECLARE
    counter_id UUID;
    period_start_date DATE;
    period_end_date DATE;
BEGIN
    -- Calculate period dates based on type
    CASE period_type_val
        WHEN 'daily' THEN
            period_start_date := CURRENT_DATE;
            period_end_date := CURRENT_DATE;
        WHEN 'weekly' THEN
            period_start_date := DATE_TRUNC('week', CURRENT_DATE)::DATE;
            period_end_date := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
        WHEN 'monthly' THEN
            period_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
            period_end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        WHEN 'yearly' THEN
            period_start_date := DATE_TRUNC('year', CURRENT_DATE)::DATE;
            period_end_date := (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day')::DATE;
        ELSE
            RAISE EXCEPTION 'Invalid period_type: %', period_type_val;
    END CASE;
    
    -- Try to get existing counter
    SELECT id INTO counter_id
    FROM usage_counters
    WHERE user_id = user_uuid
        AND (workspace_id = workspace_uuid OR (workspace_id IS NULL AND workspace_uuid IS NULL))
        AND period_type = period_type_val
        AND period_start = period_start_date;
    
    -- Create new counter if it doesn't exist
    IF counter_id IS NULL THEN
        INSERT INTO usage_counters (
            user_id, workspace_id, period_type, period_start, period_end
        ) VALUES (
            user_uuid, workspace_uuid, period_type_val, period_start_date, period_end_date
        ) RETURNING id INTO counter_id;
    END IF;
    
    RETURN counter_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check transcription quota
CREATE OR REPLACE FUNCTION check_transcription_quota(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    can_transcribe BOOLEAN,
    current_usage INTEGER,
    monthly_limit BIGINT,
    remaining INTEGER,
    upgrade_required BOOLEAN,
    recommended_plan TEXT
) AS $$
DECLARE
    limits RECORD;
    counter_id UUID;
    current_count INTEGER;
    remaining_count INTEGER;
BEGIN
    -- Get plan limits
    SELECT * INTO limits FROM get_plan_limits(user_uuid, workspace_uuid);
    
    -- Get usage counter for current month
    counter_id := get_usage_counter(user_uuid, workspace_uuid, 'monthly');
    
    -- Get current usage
    SELECT transcriptions_used INTO current_count
    FROM usage_counters
    WHERE id = counter_id;
    
    -- Calculate remaining quota
    IF limits.max_transcriptions_monthly = -1 THEN
        -- Unlimited
        remaining_count := 999999;
    ELSE
        remaining_count := GREATEST(0, limits.max_transcriptions_monthly - current_count);
    END IF;
    
    RETURN QUERY SELECT
        remaining_count > 0,
        current_count,
        limits.max_transcriptions_monthly,
        remaining_count,
        remaining_count = 0,
        CASE 
            WHEN remaining_count = 0 THEN 'upgrade_needed'
            ELSE NULL
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to check file upload quota (daily and monthly)
CREATE OR REPLACE FUNCTION check_file_upload_quota(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    can_upload BOOLEAN,
    daily_usage INTEGER,
    daily_limit INTEGER,
    daily_remaining INTEGER,
    monthly_usage INTEGER,
    monthly_limit INTEGER,
    monthly_remaining INTEGER,
    limiting_factor TEXT
) AS $$
DECLARE
    limits RECORD;
    daily_counter_id UUID;
    monthly_counter_id UUID;
    daily_count INTEGER;
    monthly_count INTEGER;
    daily_remaining INTEGER;
    monthly_remaining INTEGER;
BEGIN
    -- Get plan limits
    SELECT * INTO limits FROM get_plan_limits(user_uuid, workspace_uuid);
    
    -- Get usage counters
    daily_counter_id := get_usage_counter(user_uuid, workspace_uuid, 'daily');
    monthly_counter_id := get_usage_counter(user_uuid, workspace_uuid, 'monthly');
    
    -- Get current usage
    SELECT files_uploaded INTO daily_count
    FROM usage_counters WHERE id = daily_counter_id;
    
    SELECT files_uploaded INTO monthly_count
    FROM usage_counters WHERE id = monthly_counter_id;
    
    -- Calculate remaining quotas
    IF limits.max_files_daily = -1 THEN
        daily_remaining := 999999;
    ELSE
        daily_remaining := GREATEST(0, limits.max_files_daily - daily_count);
    END IF;
    
    IF limits.max_files_monthly = -1 THEN
        monthly_remaining := 999999;
    ELSE
        monthly_remaining := GREATEST(0, limits.max_files_monthly - monthly_count);
    END IF;
    
    RETURN QUERY SELECT
        daily_remaining > 0 AND monthly_remaining > 0,
        daily_count,
        limits.max_files_daily,
        daily_remaining,
        monthly_count,
        limits.max_files_monthly,
        monthly_remaining,
        CASE 
            WHEN daily_remaining = 0 THEN 'daily_limit'
            WHEN monthly_remaining = 0 THEN 'monthly_limit'
            ELSE NULL
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to check voice synthesis quota
CREATE OR REPLACE FUNCTION check_voice_synthesis_quota(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    can_synthesize BOOLEAN,
    current_usage INTEGER,
    monthly_limit BIGINT,
    remaining INTEGER,
    feature_available BOOLEAN
) AS $$
DECLARE
    limits RECORD;
    counter_id UUID;
    current_count INTEGER;
    remaining_count INTEGER;
    feature_enabled BOOLEAN;
BEGIN
    -- Get plan limits
    SELECT * INTO limits FROM get_plan_limits(user_uuid, workspace_uuid);
    
    -- Check if voice synthesis is available in plan
    feature_enabled := 'voice_synthesis' = ANY(limits.analysis_features);
    
    IF NOT feature_enabled THEN
        RETURN QUERY SELECT false, 0, 0::BIGINT, 0, false;
        RETURN;
    END IF;
    
    -- Get usage counter for current month
    counter_id := get_usage_counter(user_uuid, workspace_uuid, 'monthly');
    
    -- Get current usage
    SELECT voice_synthesis_used INTO current_count
    FROM usage_counters
    WHERE id = counter_id;
    
    -- Calculate remaining quota
    IF limits.max_voice_synthesis_monthly = -1 THEN
        remaining_count := 999999;
    ELSE
        remaining_count := GREATEST(0, limits.max_voice_synthesis_monthly - current_count);
    END IF;
    
    RETURN QUERY SELECT
        remaining_count > 0,
        current_count,
        limits.max_voice_synthesis_monthly,
        remaining_count,
        feature_enabled;
END;
$$ LANGUAGE plpgsql;

-- Function to check concurrent job limits
CREATE OR REPLACE FUNCTION check_concurrent_job_limit(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    can_start_job BOOLEAN,
    current_jobs INTEGER,
    max_concurrent INTEGER,
    available_slots INTEGER
) AS $$
DECLARE
    limits RECORD;
    current_job_count INTEGER;
    available_count INTEGER;
BEGIN
    -- Get plan limits
    SELECT * INTO limits FROM get_plan_limits(user_uuid, workspace_uuid);
    
    -- Count current running jobs
    SELECT COUNT(*) INTO current_job_count
    FROM processing_jobs
    WHERE user_id = user_uuid
        AND (workspace_id = workspace_uuid OR (workspace_id IS NULL AND workspace_uuid IS NULL))
        AND status IN ('queued', 'running');
    
    -- Calculate available slots
    available_count := GREATEST(0, limits.max_concurrent_jobs - current_job_count);
    
    RETURN QUERY SELECT
        available_count > 0,
        current_job_count,
        limits.max_concurrent_jobs,
        available_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate file properties against plan limits
CREATE OR REPLACE FUNCTION validate_file_upload(
    user_uuid UUID,
    workspace_uuid UUID,
    file_type TEXT,
    file_size BIGINT,
    duration_minutes INTEGER DEFAULT NULL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    validation_errors TEXT[]
) AS $$
DECLARE
    limits RECORD;
    errors TEXT[] := '{}';
    quota_check RECORD;
BEGIN
    -- Get plan limits
    SELECT * INTO limits FROM get_plan_limits(user_uuid, workspace_uuid);
    
    -- Check file type
    IF NOT (file_type = ANY(limits.allowed_file_types) OR 'all_supported_formats' = ANY(limits.allowed_file_types)) THEN
        errors := array_append(errors, 'File type not supported in current plan');
    END IF;
    
    -- Check file size (if there's a max file size limit in the plan)
    -- Note: This would need to be added to the plan schema
    
    -- Check audio duration
    IF duration_minutes IS NOT NULL AND limits.max_audio_duration_minutes > 0 THEN
        IF duration_minutes > limits.max_audio_duration_minutes THEN
            errors := array_append(errors, 
                format('Audio duration (%s min) exceeds plan limit (%s min)', 
                    duration_minutes, limits.max_audio_duration_minutes));
        END IF;
    END IF;
    
    -- Check upload quota
    SELECT * INTO quota_check FROM check_file_upload_quota(user_uuid, workspace_uuid);
    IF NOT quota_check.can_upload THEN
        IF quota_check.limiting_factor = 'daily_limit' THEN
            errors := array_append(errors, 'Daily file upload limit exceeded');
        ELSIF quota_check.limiting_factor = 'monthly_limit' THEN
            errors := array_append(errors, 'Monthly file upload limit exceeded');
        END IF;
    END IF;
    
    RETURN QUERY SELECT
        array_length(errors, 1) IS NULL OR array_length(errors, 1) = 0,
        errors;
END;
$$ LANGUAGE plpgsql;

-- Function to check feature availability
CREATE OR REPLACE FUNCTION check_feature_access(
    user_uuid UUID,
    workspace_uuid UUID,
    feature_name TEXT
)
RETURNS TABLE (
    has_access BOOLEAN,
    feature_category TEXT,
    upgrade_required BOOLEAN,
    minimum_plan TEXT
) AS $$
DECLARE
    limits RECORD;
    feature_info RECORD;
    has_feature BOOLEAN := false;
BEGIN
    -- Get plan limits
    SELECT * INTO limits FROM get_plan_limits(user_uuid, workspace_uuid);
    
    -- Get feature information
    SELECT * INTO feature_info
    FROM feature_flags
    WHERE feature_flags.feature_name = check_feature_access.feature_name;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'unknown'::TEXT, true, 'feature_not_found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if feature is available in current plan
    has_feature := (
        feature_name = ANY(limits.analysis_features) OR
        feature_name = ANY(limits.collaboration_features) OR
        feature_name = ANY(limits.integration_features) OR
        'all_features' = ANY(limits.analysis_features)
    );
    
    RETURN QUERY SELECT
        has_feature,
        feature_info.category,
        NOT has_feature,
        CASE 
            WHEN NOT has_feature THEN 
                (SELECT name FROM subscription_plans 
                 WHERE feature_name = ANY(required_plans) 
                 ORDER BY price LIMIT 1)
            ELSE NULL
        END;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- USAGE TRACKING FUNCTIONS
-- =======================================================

-- Function to increment transcription usage
CREATE OR REPLACE FUNCTION increment_transcription_usage(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    counter_id UUID;
    quota_check RECORD;
BEGIN
    -- Check quota first
    SELECT * INTO quota_check FROM check_transcription_quota(user_uuid, workspace_uuid);
    
    IF NOT quota_check.can_transcribe THEN
        RETURN false;
    END IF;
    
    -- Get counter and increment
    counter_id := get_usage_counter(user_uuid, workspace_uuid, 'monthly');
    
    UPDATE usage_counters
    SET transcriptions_used = transcriptions_used + increment_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = counter_id;
    
    -- Update peak concurrent jobs if needed
    UPDATE usage_counters
    SET concurrent_jobs_peak = GREATEST(
        concurrent_jobs_peak,
        (SELECT COUNT(*) FROM processing_jobs 
         WHERE user_id = user_uuid 
         AND status IN ('queued', 'running'))
    )
    WHERE id = counter_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment file upload usage
CREATE OR REPLACE FUNCTION increment_file_upload_usage(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    daily_counter_id UUID;
    monthly_counter_id UUID;
    quota_check RECORD;
BEGIN
    -- Check quota first
    SELECT * INTO quota_check FROM check_file_upload_quota(user_uuid, workspace_uuid);
    
    IF NOT quota_check.can_upload THEN
        RETURN false;
    END IF;
    
    -- Get counters and increment
    daily_counter_id := get_usage_counter(user_uuid, workspace_uuid, 'daily');
    monthly_counter_id := get_usage_counter(user_uuid, workspace_uuid, 'monthly');
    
    UPDATE usage_counters
    SET files_uploaded = files_uploaded + increment_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id IN (daily_counter_id, monthly_counter_id);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment voice synthesis usage
CREATE OR REPLACE FUNCTION increment_voice_synthesis_usage(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    counter_id UUID;
    quota_check RECORD;
BEGIN
    -- Check quota first
    SELECT * INTO quota_check FROM check_voice_synthesis_quota(user_uuid, workspace_uuid);
    
    IF NOT quota_check.can_synthesize THEN
        RETURN false;
    END IF;
    
    -- Get counter and increment
    counter_id := get_usage_counter(user_uuid, workspace_uuid, 'monthly');
    
    UPDATE usage_counters
    SET voice_synthesis_used = voice_synthesis_used + increment_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = counter_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment export usage
CREATE OR REPLACE FUNCTION increment_export_usage(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    counter_id UUID;
    current_usage INTEGER;
    monthly_limit INTEGER;
    limits RECORD;
BEGIN
    -- Get plan limits
    SELECT * INTO limits FROM get_plan_limits(user_uuid, workspace_uuid);
    
    -- Get counter
    counter_id := get_usage_counter(user_uuid, workspace_uuid, 'monthly');
    
    -- Get current usage
    SELECT export_operations_used INTO current_usage
    FROM usage_counters
    WHERE id = counter_id;
    
    -- Check if increment would exceed limit
    IF limits.max_export_operations_monthly != -1 THEN
        IF current_usage + increment_by > limits.max_export_operations_monthly THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Increment usage
    UPDATE usage_counters
    SET export_operations_used = export_operations_used + increment_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = counter_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- PRIORITY AND QUEUE MANAGEMENT
-- =======================================================

-- Function to get processing priority for a user
CREATE OR REPLACE FUNCTION get_processing_priority(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    limits RECORD;
BEGIN
    SELECT * INTO limits FROM get_plan_limits(user_uuid, workspace_uuid);
    RETURN limits.priority_level;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can start a new processing job
CREATE OR REPLACE FUNCTION can_start_processing_job(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL,
    job_type TEXT DEFAULT 'transcription'
)
RETURNS TABLE (
    can_start BOOLEAN,
    reason TEXT,
    suggested_action TEXT
) AS $$
DECLARE
    concurrent_check RECORD;
    quota_check RECORD;
    feature_check RECORD;
BEGIN
    -- Check concurrent job limits
    SELECT * INTO concurrent_check FROM check_concurrent_job_limit(user_uuid, workspace_uuid);
    
    IF NOT concurrent_check.can_start_job THEN
        RETURN QUERY SELECT 
            false, 
            'Concurrent job limit reached',
            'Wait for current jobs to complete or upgrade plan';
        RETURN;
    END IF;
    
    -- Check specific quota based on job type
    IF job_type = 'transcription' THEN
        SELECT * INTO quota_check FROM check_transcription_quota(user_uuid, workspace_uuid);
        IF NOT quota_check.can_transcribe THEN
            RETURN QUERY SELECT 
                false, 
                'Monthly transcription limit reached',
                'Upgrade plan to increase transcription quota';
            RETURN;
        END IF;
    ELSIF job_type = 'voice_synthesis' THEN
        SELECT * INTO quota_check FROM check_voice_synthesis_quota(user_uuid, workspace_uuid);
        IF NOT quota_check.can_synthesize THEN
            RETURN QUERY SELECT 
                false, 
                'Voice synthesis not available or quota exceeded',
                'Upgrade plan to access voice synthesis features';
            RETURN;
        END IF;
    END IF;
    
    -- Check feature access
    SELECT * INTO feature_check FROM check_feature_access(user_uuid, workspace_uuid, job_type);
    IF NOT feature_check.has_access THEN
        RETURN QUERY SELECT 
            false, 
            'Feature not available in current plan',
            format('Upgrade to %s plan to access this feature', feature_check.minimum_plan);
        RETURN;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT true, 'All checks passed', NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- USAGE RESET FUNCTIONS
-- =======================================================

-- Function to reset usage counters (called by scheduled job)
CREATE OR REPLACE FUNCTION reset_usage_counters()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER := 0;
BEGIN
    -- Reset daily counters
    UPDATE usage_counters
    SET files_uploaded = 0,
        concurrent_jobs_peak = 0,
        last_reset_at = CURRENT_TIMESTAMP
    WHERE period_type = 'daily'
        AND period_start < CURRENT_DATE
        AND auto_reset = true;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    -- Reset monthly counters
    UPDATE usage_counters
    SET transcriptions_used = 0,
        files_uploaded = 0,
        voice_synthesis_used = 0,
        export_operations_used = 0,
        total_processing_minutes = 0,
        concurrent_jobs_peak = 0,
        last_reset_at = CURRENT_TIMESTAMP
    WHERE period_type = 'monthly'
        AND period_start < DATE_TRUNC('month', CURRENT_DATE)
        AND auto_reset = true;
    
    GET DIAGNOSTICS reset_count = reset_count + ROW_COUNT;
    
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- MONITORING AND REPORTING VIEWS
-- =======================================================

-- View for real-time quota monitoring
CREATE OR REPLACE VIEW quota_monitoring AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    w.id as workspace_id,
    w.name as workspace_name,
    sp.name as plan_name,
    sp.plan_category,
    
    -- Transcription quota
    uc_monthly.transcriptions_used,
    sp.max_transcriptions_monthly,
    CASE 
        WHEN sp.max_transcriptions_monthly = -1 THEN 100.0
        ELSE (uc_monthly.transcriptions_used::FLOAT / NULLIF(sp.max_transcriptions_monthly, 0)) * 100
    END as transcription_usage_percent,
    
    -- File upload quota (daily)
    uc_daily.files_uploaded as daily_files_uploaded,
    sp.max_files_daily,
    CASE 
        WHEN sp.max_files_daily = -1 THEN 100.0
        ELSE (uc_daily.files_uploaded::FLOAT / NULLIF(sp.max_files_daily, 0)) * 100
    END as daily_file_usage_percent,
    
    -- File upload quota (monthly)
    uc_monthly.files_uploaded as monthly_files_uploaded,
    sp.max_files_monthly,
    CASE 
        WHEN sp.max_files_monthly = -1 THEN 100.0
        ELSE (uc_monthly.files_uploaded::FLOAT / NULLIF(sp.max_files_monthly, 0)) * 100
    END as monthly_file_usage_percent,
    
    -- Voice synthesis quota
    uc_monthly.voice_synthesis_used,
    sp.max_voice_synthesis_monthly,
    CASE 
        WHEN sp.max_voice_synthesis_monthly = -1 THEN 100.0
        ELSE (uc_monthly.voice_synthesis_used::FLOAT / NULLIF(sp.max_voice_synthesis_monthly, 0)) * 100
    END as voice_synthesis_usage_percent,
    
    -- Current concurrent jobs
    (SELECT COUNT(*) FROM processing_jobs pj 
     WHERE pj.user_id = u.id AND pj.status IN ('queued', 'running')) as current_concurrent_jobs,
    sp.max_concurrent_jobs,
    
    sp.priority_level
FROM users u
LEFT JOIN workspace_users wu ON u.id = wu.user_id
LEFT JOIN workspaces w ON wu.workspace_id = w.id
LEFT JOIN workspace_subscriptions ws ON w.id = ws.workspace_id AND ws.status = 'active'
LEFT JOIN subscription_plans sp ON ws.plan_id = sp.id
LEFT JOIN usage_counters uc_daily ON (
    u.id = uc_daily.user_id 
    AND w.id = uc_daily.workspace_id 
    AND uc_daily.period_type = 'daily'
    AND uc_daily.period_start = CURRENT_DATE
)
LEFT JOIN usage_counters uc_monthly ON (
    u.id = uc_monthly.user_id 
    AND w.id = uc_monthly.workspace_id 
    AND uc_monthly.period_type = 'monthly'
    AND uc_monthly.period_start = DATE_TRUNC('month', CURRENT_DATE)
)
WHERE u.is_active = true;

RAISE NOTICE 'Plan enforcement and quota checking system installed successfully!';
RAISE NOTICE 'Key functions available:';
RAISE NOTICE '- check_transcription_quota(user_id, workspace_id)';
RAISE NOTICE '- check_file_upload_quota(user_id, workspace_id)';
RAISE NOTICE '- check_voice_synthesis_quota(user_id, workspace_id)';
RAISE NOTICE '- validate_file_upload(user_id, workspace_id, file_type, file_size, duration)';
RAISE NOTICE '- can_start_processing_job(user_id, workspace_id, job_type)';
RAISE NOTICE '- Real-time quota monitoring with quota_monitoring view';