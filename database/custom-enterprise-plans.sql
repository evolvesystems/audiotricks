-- AudioTricks Custom Enterprise Plans System
-- This file provides enterprise-grade custom plan creation and management

-- =======================================================
-- CUSTOM PLAN MANAGEMENT FUNCTIONS
-- =======================================================

-- Function to create a custom plan for an enterprise workspace
CREATE OR REPLACE FUNCTION create_custom_enterprise_plan(
    workspace_uuid UUID,
    plan_name_val VARCHAR(100),
    description_val TEXT,
    base_plan_code VARCHAR(50) DEFAULT 'enterprise_monthly',
    custom_price_val DECIMAL(10,2) DEFAULT NULL,
    custom_limits_json JSONB DEFAULT '{}',
    custom_features_array TEXT[] DEFAULT '{}',
    contract_months INTEGER DEFAULT 12,
    requested_by_uuid UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    base_plan RECORD;
    custom_plan_id UUID;
    contract_start_date DATE := CURRENT_DATE;
    contract_end_date DATE;
BEGIN
    -- Get base plan details
    SELECT * INTO base_plan
    FROM subscription_plans
    WHERE plan_code = base_plan_code AND is_active = true;
    
    IF base_plan.id IS NULL THEN
        RAISE EXCEPTION 'Base plan % not found', base_plan_code;
    END IF;
    
    -- Calculate contract end date
    contract_end_date := contract_start_date + (contract_months || ' months')::INTERVAL;
    
    -- Create custom plan record
    INSERT INTO custom_plans (
        workspace_id,
        base_plan_id,
        plan_name,
        description,
        
        -- Custom limits (extract from JSON or use base plan)
        custom_max_transcriptions_monthly,
        custom_max_files_daily,
        custom_max_files_monthly,
        custom_max_concurrent_jobs,
        custom_max_voice_synthesis_monthly,
        custom_max_export_operations_monthly,
        custom_max_audio_duration_minutes,
        custom_priority_level,
        
        -- Pricing
        custom_price,
        pricing_model,
        billing_interval,
        
        -- Contract details
        contract_start_date,
        contract_end_date,
        auto_renew,
        notice_period_days,
        
        -- Features
        custom_features,
        
        -- Workflow
        requested_by,
        approval_status
    ) VALUES (
        workspace_uuid,
        base_plan.id,
        plan_name_val,
        description_val,
        
        -- Extract custom limits from JSON or use base plan defaults
        COALESCE((custom_limits_json->>'max_transcriptions_monthly')::BIGINT, base_plan.max_transcriptions_monthly),
        COALESCE((custom_limits_json->>'max_files_daily')::INTEGER, base_plan.max_files_daily),
        COALESCE((custom_limits_json->>'max_files_monthly')::INTEGER, base_plan.max_files_monthly),
        COALESCE((custom_limits_json->>'max_concurrent_jobs')::INTEGER, base_plan.max_concurrent_jobs),
        COALESCE((custom_limits_json->>'max_voice_synthesis_monthly')::BIGINT, base_plan.max_voice_synthesis_monthly),
        COALESCE((custom_limits_json->>'max_export_operations_monthly')::INTEGER, base_plan.max_export_operations_monthly),
        COALESCE((custom_limits_json->>'max_audio_duration_minutes')::INTEGER, base_plan.max_audio_duration_minutes),
        COALESCE((custom_limits_json->>'priority_level')::INTEGER, base_plan.priority_level),
        
        -- Pricing
        COALESCE(custom_price_val, base_plan.price),
        'fixed',
        'monthly',
        
        -- Contract
        contract_start_date,
        contract_end_date,
        false, -- Default to manual renewal for enterprise
        30,    -- 30 day notice period
        
        -- Features
        CASE 
            WHEN array_length(custom_features_array, 1) > 0 THEN custom_features_array
            ELSE base_plan.features
        END,
        
        -- Workflow
        requested_by_uuid,
        'pending'
    ) RETURNING id INTO custom_plan_id;
    
    -- Create audit log
    INSERT INTO audit_logs (
        user_id,
        workspace_id,
        action,
        resource,
        resource_id,
        category,
        details,
        outcome
    ) VALUES (
        requested_by_uuid,
        workspace_uuid,
        'create',
        'custom_plan',
        custom_plan_id,
        'billing',
        jsonb_build_object(
            'plan_name', plan_name_val,
            'base_plan', base_plan_code,
            'custom_price', custom_price_val,
            'contract_months', contract_months
        ),
        'success'
    );
    
    RAISE NOTICE 'Custom enterprise plan % created for workspace %', plan_name_val, workspace_uuid;
    RETURN custom_plan_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve a custom plan
CREATE OR REPLACE FUNCTION approve_custom_plan(
    custom_plan_uuid UUID,
    approved_by_uuid UUID,
    approval_notes_val TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    custom_plan RECORD;
    new_subscription_id UUID;
BEGIN
    -- Get custom plan details
    SELECT * INTO custom_plan
    FROM custom_plans
    WHERE id = custom_plan_uuid AND approval_status = 'pending';
    
    IF custom_plan.id IS NULL THEN
        RAISE EXCEPTION 'Custom plan not found or already processed';
    END IF;
    
    -- Update custom plan status
    UPDATE custom_plans
    SET 
        approval_status = 'approved',
        approved_by = approved_by_uuid,
        approval_notes = approval_notes_val,
        is_active = true,
        activated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = custom_plan_uuid;
    
    -- Create or update workspace subscription
    INSERT INTO workspace_subscriptions (
        workspace_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        next_billing_date,
        created_at,
        activated_at
    ) VALUES (
        custom_plan.workspace_id,
        custom_plan.base_plan_id, -- Link to base plan for standard operations
        'active',
        custom_plan.contract_start_date,
        custom_plan.contract_end_date,
        custom_plan.contract_start_date + INTERVAL '1 month',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id) 
    DO UPDATE SET
        plan_id = custom_plan.base_plan_id,
        status = 'active',
        current_period_start = custom_plan.contract_start_date,
        current_period_end = custom_plan.contract_end_date,
        activated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Update storage quotas based on custom plan
    UPDATE storage_quotas
    SET
        max_storage_bytes = (
            SELECT max_storage_mb * 1024 * 1024 
            FROM subscription_plans 
            WHERE id = custom_plan.base_plan_id
        ),
        max_file_size = COALESCE(
            custom_plan.custom_max_audio_duration_minutes * 1024 * 1024, -- Rough estimate
            (SELECT max_file_size FROM subscription_plans WHERE id = custom_plan.base_plan_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE workspace_id = custom_plan.workspace_id;
    
    -- Create audit log
    INSERT INTO audit_logs (
        user_id,
        workspace_id,
        action,
        resource,
        resource_id,
        category,
        details,
        outcome
    ) VALUES (
        approved_by_uuid,
        custom_plan.workspace_id,
        'approve',
        'custom_plan',
        custom_plan_uuid,
        'billing',
        jsonb_build_object(
            'plan_name', custom_plan.plan_name,
            'approval_notes', approval_notes_val,
            'contract_start', custom_plan.contract_start_date,
            'contract_end', custom_plan.contract_end_date
        ),
        'success'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get custom plan limits for a workspace
CREATE OR REPLACE FUNCTION get_custom_plan_limits(workspace_uuid UUID)
RETURNS TABLE (
    has_custom_plan BOOLEAN,
    plan_name TEXT,
    max_transcriptions_monthly BIGINT,
    max_files_daily INTEGER,
    max_files_monthly INTEGER,
    max_concurrent_jobs INTEGER,
    max_voice_synthesis_monthly BIGINT,
    max_export_operations_monthly INTEGER,
    max_audio_duration_minutes INTEGER,
    priority_level INTEGER,
    custom_features TEXT[],
    contract_end_date DATE,
    is_active BOOLEAN
) AS $$
DECLARE
    custom_plan RECORD;
BEGIN
    -- Get active custom plan for workspace
    SELECT * INTO custom_plan
    FROM custom_plans
    WHERE workspace_id = workspace_uuid 
        AND approval_status = 'approved'
        AND is_active = true
        AND (contract_end_date IS NULL OR contract_end_date >= CURRENT_DATE);
    
    IF custom_plan.id IS NULL THEN
        -- No custom plan, return defaults
        RETURN QUERY SELECT 
            false, NULL::TEXT, 0::BIGINT, 0, 0, 0, 0::BIGINT, 0, 0, 0, 
            NULL::TEXT[], NULL::DATE, false;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT
        true,
        custom_plan.plan_name,
        custom_plan.custom_max_transcriptions_monthly,
        custom_plan.custom_max_files_daily,
        custom_plan.custom_max_files_monthly,
        custom_plan.custom_max_concurrent_jobs,
        custom_plan.custom_max_voice_synthesis_monthly,
        custom_plan.custom_max_export_operations_monthly,
        custom_plan.custom_max_audio_duration_minutes,
        custom_plan.custom_priority_level,
        custom_plan.custom_features,
        custom_plan.contract_end_date,
        custom_plan.is_active;
END;
$$ LANGUAGE plpgsql;

-- Enhanced get_plan_limits function that considers custom plans
CREATE OR REPLACE FUNCTION get_plan_limits_enhanced(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    plan_name TEXT,
    plan_type TEXT, -- 'standard' or 'custom'
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
    custom_limits RECORD;
    standard_limits RECORD;
BEGIN
    -- Check for custom plan first
    IF workspace_uuid IS NOT NULL THEN
        SELECT * INTO custom_limits FROM get_custom_plan_limits(workspace_uuid);
        
        IF custom_limits.has_custom_plan THEN
            -- Get base plan features for custom plan
            SELECT sp.allowed_file_types, sp.analysis_features, 
                   sp.collaboration_features, sp.integration_features
            INTO standard_limits
            FROM custom_plans cp
            JOIN subscription_plans sp ON cp.base_plan_id = sp.id
            WHERE cp.workspace_id = workspace_uuid 
                AND cp.approval_status = 'approved'
                AND cp.is_active = true;
            
            RETURN QUERY SELECT
                custom_limits.plan_name,
                'custom'::TEXT,
                custom_limits.max_transcriptions_monthly,
                custom_limits.max_files_daily,
                custom_limits.max_files_monthly,
                custom_limits.max_concurrent_jobs,
                custom_limits.max_voice_synthesis_monthly,
                custom_limits.max_export_operations_monthly,
                custom_limits.max_audio_duration_minutes,
                custom_limits.priority_level,
                COALESCE(standard_limits.allowed_file_types, ARRAY[]::TEXT[]),
                COALESCE(standard_limits.analysis_features, custom_limits.custom_features),
                COALESCE(standard_limits.collaboration_features, ARRAY[]::TEXT[]),
                COALESCE(standard_limits.integration_features, ARRAY[]::TEXT[]);
            RETURN;
        END IF;
    END IF;
    
    -- Fall back to standard plan limits
    SELECT * INTO standard_limits FROM get_plan_limits(user_uuid, workspace_uuid);
    
    RETURN QUERY SELECT
        standard_limits.plan_name,
        'standard'::TEXT,
        standard_limits.max_transcriptions_monthly,
        standard_limits.max_files_daily,
        standard_limits.max_files_monthly,
        standard_limits.max_concurrent_jobs,
        standard_limits.max_voice_synthesis_monthly,
        standard_limits.max_export_operations_monthly,
        standard_limits.max_audio_duration_minutes,
        standard_limits.priority_level,
        standard_limits.allowed_file_types,
        standard_limits.analysis_features,
        standard_limits.collaboration_features,
        standard_limits.integration_features;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- ENTERPRISE PLAN TEMPLATES
-- =======================================================

-- Function to create enterprise plan templates
CREATE OR REPLACE FUNCTION create_enterprise_plan_templates()
RETURNS VOID AS $$
BEGIN
    -- Government/Public Sector Template
    INSERT INTO custom_plans (
        workspace_id,
        base_plan_id,
        plan_name,
        description,
        custom_max_transcriptions_monthly,
        custom_max_files_daily,
        custom_max_files_monthly,
        custom_max_concurrent_jobs,
        custom_max_voice_synthesis_monthly,
        custom_max_export_operations_monthly,
        custom_max_audio_duration_minutes,
        custom_priority_level,
        custom_features,
        custom_price,
        pricing_model,
        contract_start_date,
        contract_end_date,
        approval_status,
        is_active
    ) VALUES (
        '00000000-0000-0000-0000-000000000001'::UUID, -- Template UUID
        (SELECT id FROM subscription_plans WHERE plan_code = 'enterprise_monthly'),
        'Government Sector Enterprise',
        'Specialized plan for government agencies and public sector organizations',
        -1, -- Unlimited transcriptions
        -1, -- Unlimited daily files
        -1, -- Unlimited monthly files
        100, -- 100 concurrent jobs
        -1, -- Unlimited voice synthesis
        -1, -- Unlimited exports
        0,  -- No duration limit
        10, -- Highest priority
        ARRAY['all_features', 'government_compliance', 'advanced_security', 'audit_trails', 'data_sovereignty'],
        499.99,
        'fixed',
        '2024-01-01',
        '2025-01-01',
        'template',
        false
    );
    
    -- Healthcare Template
    INSERT INTO custom_plans (
        workspace_id,
        base_plan_id,
        plan_name,
        description,
        custom_max_transcriptions_monthly,
        custom_max_files_daily,
        custom_max_files_monthly,
        custom_max_concurrent_jobs,
        custom_max_voice_synthesis_monthly,
        custom_max_export_operations_monthly,
        custom_max_audio_duration_minutes,
        custom_priority_level,
        custom_features,
        custom_price,
        pricing_model,
        approval_status,
        is_active
    ) VALUES (
        '00000000-0000-0000-0000-000000000002'::UUID, -- Template UUID
        (SELECT id FROM subscription_plans WHERE plan_code = 'enterprise_monthly'),
        'Healthcare Enterprise',
        'HIPAA-compliant plan for healthcare organizations',
        50000, -- 50K transcriptions
        1000,  -- 1K daily files
        30000, -- 30K monthly files
        50,    -- 50 concurrent jobs
        10000, -- 10K voice synthesis
        5000,  -- 5K exports
        0,     -- No duration limit
        9,     -- High priority
        ARRAY['all_features', 'hipaa_compliance', 'phi_protection', 'secure_storage', 'audit_trails'],
        399.99,
        'fixed',
        'template',
        false
    );
    
    -- Education Template
    INSERT INTO custom_plans (
        workspace_id,
        base_plan_id,
        plan_name,
        description,
        custom_max_transcriptions_monthly,
        custom_max_files_daily,
        custom_max_files_monthly,
        custom_max_concurrent_jobs,
        custom_max_voice_synthesis_monthly,
        custom_max_export_operations_monthly,
        custom_max_audio_duration_minutes,
        custom_priority_level,
        custom_features,
        custom_price,
        pricing_model,
        approval_status,
        is_active
    ) VALUES (
        '00000000-0000-0000-0000-000000000003'::UUID, -- Template UUID
        (SELECT id FROM subscription_plans WHERE plan_code = 'enterprise_monthly'),
        'Education Enterprise',
        'Specialized plan for educational institutions',
        100000, -- 100K transcriptions (for lectures)
        2000,   -- 2K daily files
        60000,  -- 60K monthly files
        75,     -- 75 concurrent jobs
        25000,  -- 25K voice synthesis
        10000,  -- 10K exports
        0,      -- No duration limit
        8,      -- High priority
        ARRAY['all_features', 'educational_tools', 'bulk_processing', 'student_collaboration', 'accessibility_features'],
        299.99,
        'fixed',
        'template',
        false
    );
    
    -- Media/Broadcasting Template
    INSERT INTO custom_plans (
        workspace_id,
        base_plan_id,
        plan_name,
        description,
        custom_max_transcriptions_monthly,
        custom_max_files_daily,
        custom_max_files_monthly,
        custom_max_concurrent_jobs,
        custom_max_voice_synthesis_monthly,
        custom_max_export_operations_monthly,
        custom_max_audio_duration_minutes,
        custom_priority_level,
        custom_features,
        custom_price,
        pricing_model,
        approval_status,
        is_active
    ) VALUES (
        '00000000-0000-0000-0000-000000000004'::UUID, -- Template UUID
        (SELECT id FROM subscription_plans WHERE plan_code = 'enterprise_monthly'),
        'Media & Broadcasting Enterprise',
        'High-volume plan for media companies and broadcasters',
        -1,    -- Unlimited transcriptions
        5000,  -- 5K daily files
        150000, -- 150K monthly files
        200,   -- 200 concurrent jobs
        -1,    -- Unlimited voice synthesis
        -1,    -- Unlimited exports
        0,     -- No duration limit
        10,    -- Highest priority
        ARRAY['all_features', 'real_time_processing', 'broadcast_integration', 'live_streaming', 'multi_language'],
        999.99,
        'fixed',
        'template',
        false
    );
END;
$$ LANGUAGE plpgsql;

-- Execute template creation
SELECT create_enterprise_plan_templates();

-- =======================================================
-- CUSTOM PLAN BILLING FUNCTIONS
-- =======================================================

-- Function to calculate custom plan billing
CREATE OR REPLACE FUNCTION calculate_custom_plan_billing(
    workspace_uuid UUID,
    billing_period_start DATE,
    billing_period_end DATE
)
RETURNS TABLE (
    base_amount DECIMAL(10,2),
    usage_overages DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    billing_details JSONB
) AS $$
DECLARE
    custom_plan RECORD;
    usage_stats RECORD;
    base_cost DECIMAL := 0;
    overage_cost DECIMAL := 0;
    details JSONB;
BEGIN
    -- Get custom plan
    SELECT * INTO custom_plan
    FROM custom_plans
    WHERE workspace_id = workspace_uuid 
        AND approval_status = 'approved'
        AND is_active = true;
    
    IF custom_plan.id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get usage statistics for billing period
    SELECT 
        SUM(transcriptions_used) as total_transcriptions,
        SUM(files_uploaded) as total_files,
        SUM(voice_synthesis_used) as total_voice_synthesis,
        SUM(export_operations_used) as total_exports
    INTO usage_stats
    FROM usage_counters
    WHERE workspace_id = workspace_uuid
        AND period_start >= billing_period_start
        AND period_end <= billing_period_end;
    
    -- Calculate base cost
    base_cost := custom_plan.custom_price;
    
    -- Calculate overages (if any limits are set and exceeded)
    overage_cost := 0;
    
    -- Add overage calculations based on usage vs custom limits
    -- (Implementation would depend on specific overage rates defined in contract)
    
    -- Build billing details
    details := jsonb_build_object(
        'plan_name', custom_plan.plan_name,
        'billing_period', jsonb_build_object(
            'start', billing_period_start,
            'end', billing_period_end
        ),
        'usage', jsonb_build_object(
            'transcriptions', COALESCE(usage_stats.total_transcriptions, 0),
            'files', COALESCE(usage_stats.total_files, 0),
            'voice_synthesis', COALESCE(usage_stats.total_voice_synthesis, 0),
            'exports', COALESCE(usage_stats.total_exports, 0)
        ),
        'limits', jsonb_build_object(
            'transcriptions', custom_plan.custom_max_transcriptions_monthly,
            'files_daily', custom_plan.custom_max_files_daily,
            'files_monthly', custom_plan.custom_max_files_monthly,
            'voice_synthesis', custom_plan.custom_max_voice_synthesis_monthly
        )
    );
    
    RETURN QUERY SELECT
        base_cost,
        overage_cost,
        base_cost + overage_cost,
        details;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- MONITORING AND MANAGEMENT VIEWS
-- =======================================================

-- View for custom plan management dashboard
CREATE OR REPLACE VIEW custom_plan_dashboard AS
SELECT 
    cp.id,
    cp.workspace_id,
    w.name as workspace_name,
    cp.plan_name,
    cp.description,
    sp.name as base_plan_name,
    cp.custom_price,
    cp.approval_status,
    cp.is_active,
    cp.contract_start_date,
    cp.contract_end_date,
    cp.auto_renew,
    CASE 
        WHEN cp.contract_end_date < CURRENT_DATE THEN 'expired'
        WHEN cp.contract_end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        WHEN cp.approval_status = 'pending' THEN 'pending_approval'
        WHEN cp.is_active THEN 'active'
        ELSE 'inactive'
    END as status,
    
    -- Usage summary for current month
    uc.transcriptions_used,
    uc.files_uploaded,
    uc.voice_synthesis_used,
    uc.export_operations_used,
    
    -- Custom limits
    cp.custom_max_transcriptions_monthly,
    cp.custom_max_files_monthly,
    cp.custom_max_voice_synthesis_monthly,
    
    -- Utilization percentages
    CASE 
        WHEN cp.custom_max_transcriptions_monthly = -1 THEN 0
        ELSE (uc.transcriptions_used::FLOAT / NULLIF(cp.custom_max_transcriptions_monthly, 0)) * 100
    END as transcription_utilization,
    
    cp.requested_by,
    req_user.username as requested_by_username,
    cp.approved_by,
    app_user.username as approved_by_username,
    cp.created_at,
    cp.activated_at
    
FROM custom_plans cp
JOIN workspaces w ON cp.workspace_id = w.id
JOIN subscription_plans sp ON cp.base_plan_id = sp.id
LEFT JOIN users req_user ON cp.requested_by = req_user.id
LEFT JOIN users app_user ON cp.approved_by = app_user.id
LEFT JOIN usage_counters uc ON (
    cp.workspace_id = uc.workspace_id
    AND uc.period_type = 'monthly'
    AND uc.period_start = DATE_TRUNC('month', CURRENT_DATE)
)
WHERE cp.approval_status != 'template'
ORDER BY cp.created_at DESC;

-- View for enterprise plan templates
CREATE OR REPLACE VIEW enterprise_plan_templates AS
SELECT 
    cp.id,
    cp.plan_name,
    cp.description,
    sp.name as base_plan_name,
    cp.custom_price,
    cp.custom_max_transcriptions_monthly,
    cp.custom_max_files_daily,
    cp.custom_max_files_monthly,
    cp.custom_max_concurrent_jobs,
    cp.custom_max_voice_synthesis_monthly,
    cp.custom_priority_level,
    cp.custom_features,
    
    -- Template categorization
    CASE 
        WHEN cp.plan_name ILIKE '%government%' THEN 'government'
        WHEN cp.plan_name ILIKE '%healthcare%' THEN 'healthcare'
        WHEN cp.plan_name ILIKE '%education%' THEN 'education'
        WHEN cp.plan_name ILIKE '%media%' THEN 'media'
        ELSE 'general'
    END as template_category
    
FROM custom_plans cp
JOIN subscription_plans sp ON cp.base_plan_id = sp.id
WHERE cp.approval_status = 'template'
ORDER BY cp.plan_name;

RAISE NOTICE 'Custom enterprise plans system installed successfully!';
RAISE NOTICE 'Key features:';
RAISE NOTICE '- create_custom_enterprise_plan() - Create tailored enterprise plans';
RAISE NOTICE '- approve_custom_plan() - Approval workflow for custom plans';
RAISE NOTICE '- get_custom_plan_limits() - Retrieve custom plan limits';
RAISE NOTICE '- get_plan_limits_enhanced() - Enhanced limits with custom plan support';
RAISE NOTICE '- Enterprise plan templates for Government, Healthcare, Education, Media';
RAISE NOTICE '- Custom plan dashboard and monitoring views';
RAISE NOTICE '- Custom billing calculation functions';