-- AudioTricks User & Workspace Creation Automation
-- This file contains all automation functions and triggers for user and workspace creation

-- =======================================================
-- WORKSPACE INITIALIZATION AUTOMATION
-- =======================================================

-- Function to initialize a new workspace with all required related records
CREATE OR REPLACE FUNCTION initialize_new_workspace(workspace_uuid UUID)
RETURNS VOID AS $$
DECLARE
    free_plan_id UUID;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id 
    FROM subscription_plans 
    WHERE plan_code = 'free' AND is_active = true
    LIMIT 1;
    
    -- If no free plan exists, create one
    IF free_plan_id IS NULL THEN
        INSERT INTO subscription_plans (
            id, name, description, plan_code, price, currency, billing_interval,
            max_api_calls, max_tokens, max_storage_mb, max_processing_min,
            max_workspaces, max_users, max_file_size, features, is_active, is_public, sort_order
        ) VALUES (
            gen_random_uuid(),
            'Free',
            'Free tier with basic features',
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
        ) RETURNING id INTO free_plan_id;
    END IF;

    -- 1. Create default workspace settings
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

    -- 2. Create storage quota
    INSERT INTO storage_quotas (
        workspace_id,
        max_storage_bytes,
        max_file_count,
        max_file_size,
        max_monthly_uploads,
        current_storage_bytes,
        current_file_count,
        monthly_uploads,
        monthly_upload_bytes,
        retention_days,
        auto_cleanup,
        archive_threshold_days,
        archive_storage_class
    ) VALUES (
        workspace_uuid,
        104857600,  -- 100MB for free tier
        100,        -- 100 files max
        26214400,   -- 25MB max file size
        50,         -- 50 uploads per month
        0,          -- Start with 0
        0,          -- Start with 0
        0,          -- Start with 0
        0,          -- Start with 0
        365,        -- 1 year retention
        true,       -- Auto cleanup enabled
        90,         -- Archive after 90 days
        'cold'      -- Cold storage class
    );

    -- 3. Create workspace subscription (Free tier)
    INSERT INTO workspace_subscriptions (
        id,
        workspace_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        next_billing_date,
        trial_end_date,
        created_at,
        activated_at
    ) VALUES (
        gen_random_uuid(),
        workspace_uuid,
        free_plan_id,
        'active',
        current_date,
        current_date + INTERVAL '1 month',
        current_date + INTERVAL '1 month',
        NULL, -- No trial for free tier
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- 4. Create audit log entry
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
        NULL, -- System action
        workspace_uuid,
        'create',
        'workspace',
        workspace_uuid,
        'system',
        '{"automation": "workspace_initialization", "components": ["settings", "storage_quota", "subscription"]}'::jsonb,
        'success'
    );

    RAISE NOTICE 'Workspace % initialized successfully with Free tier subscription', workspace_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to set workspace owner and initialize their permissions
CREATE OR REPLACE FUNCTION setup_workspace_owner(workspace_uuid UUID, owner_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create workspace user relationship with owner role
    INSERT INTO workspace_users (
        workspace_id,
        user_id,
        role,
        permissions,
        joined_at,
        last_active_at
    ) VALUES (
        workspace_uuid,
        owner_user_id,
        'owner',
        '{
            "admin": true,
            "billing": true,
            "user_management": true,
            "settings": true,
            "all_files": true
        }'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- Create default alert rules for the workspace owner
    INSERT INTO alert_rules (
        user_id,
        workspace_id,
        rule_name,
        metric_type,
        threshold_value,
        threshold_type,
        comparison_operator,
        notification_methods,
        is_active
    ) VALUES 
    (
        owner_user_id,
        workspace_uuid,
        'Workspace Storage Warning',
        'storage_mb',
        80.0,
        'percentage',
        '>=',
        ARRAY['email'],
        true
    ),
    (
        owner_user_id,
        workspace_uuid,
        'Monthly API Usage Warning',
        'api_calls',
        90.0,
        'percentage',
        '>=',
        ARRAY['email'],
        true
    );

    -- Log the workspace owner setup
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
        owner_user_id,
        workspace_uuid,
        'assign',
        'workspace_owner',
        workspace_uuid,
        'user_action',
        '{"role": "owner", "permissions": "full_access"}'::jsonb,
        'success'
    );
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- USER INITIALIZATION AUTOMATION
-- =======================================================

-- Function to initialize a new user with default settings and quotas
CREATE OR REPLACE FUNCTION initialize_new_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Create user settings with defaults
    INSERT INTO user_settings (
        user_id,
        settings_json
    ) VALUES (
        user_uuid,
        '{
            "theme": "light",
            "language": "en",
            "timezone": "UTC",
            "email_notifications": true,
            "processing_notifications": true,
            "weekly_reports": true,
            "auto_save": true,
            "default_summary_style": "formal",
            "default_transcription_model": "whisper-1"
        }'::jsonb
    );

    -- 2. Create user quota (applies to personal workspace)
    INSERT INTO user_quotas (
        user_id,
        period_start,
        period_end,
        api_calls_used,
        api_calls_limit,
        tokens_used,
        tokens_limit,
        storage_used_mb,
        storage_limit_mb,
        processing_minutes_used,
        processing_minutes_limit,
        allow_overages,
        overage_rate
    ) VALUES (
        user_uuid,
        DATE_TRUNC('month', CURRENT_DATE),
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
        0,      -- Start with 0
        100,    -- Free tier: 100 API calls
        0,      -- Start with 0
        10000,  -- Free tier: 10K tokens
        0,      -- Start with 0
        100,    -- Free tier: 100MB
        0,      -- Start with 0
        30,     -- Free tier: 30 minutes
        false,  -- No overages on free tier
        0.001   -- Default overage rate
    );

    -- 3. Create default alert rules for the user
    PERFORM create_default_alert_rules(user_uuid);

    -- 4. Create audit log entry
    INSERT INTO audit_logs (
        user_id,
        action,
        resource,
        resource_id,
        category,
        details,
        outcome
    ) VALUES (
        user_uuid,
        'create',
        'user',
        user_uuid,
        'system',
        '{"automation": "user_initialization", "components": ["settings", "quota", "alert_rules"]}'::jsonb,
        'success'
    );

    RAISE NOTICE 'User % initialized successfully with default settings and quota', user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- DATABASE TRIGGERS
-- =======================================================

-- Trigger function for workspace creation
CREATE OR REPLACE FUNCTION trigger_workspace_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize the new workspace
    PERFORM initialize_new_workspace(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for user creation
CREATE OR REPLACE FUNCTION trigger_user_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize the new user
    PERFORM initialize_new_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS workspace_initialization_trigger ON workspaces;
CREATE TRIGGER workspace_initialization_trigger
    AFTER INSERT ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION trigger_workspace_created();

DROP TRIGGER IF EXISTS user_initialization_trigger ON users;
CREATE TRIGGER user_initialization_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_user_created();

-- =======================================================
-- SUBSCRIPTION MANAGEMENT AUTOMATION
-- =======================================================

-- Function to upgrade workspace subscription
CREATE OR REPLACE FUNCTION upgrade_workspace_subscription(
    workspace_uuid UUID,
    new_plan_code VARCHAR(50),
    effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
    new_plan_id UUID;
    current_subscription workspace_subscriptions%ROWTYPE;
    old_plan subscription_plans%ROWTYPE;
    new_plan subscription_plans%ROWTYPE;
BEGIN
    -- Get the new plan
    SELECT id INTO new_plan_id 
    FROM subscription_plans 
    WHERE plan_code = new_plan_code AND is_active = true;
    
    IF new_plan_id IS NULL THEN
        RAISE EXCEPTION 'Plan with code % not found or inactive', new_plan_code;
    END IF;

    -- Get current subscription
    SELECT * INTO current_subscription
    FROM workspace_subscriptions 
    WHERE workspace_id = workspace_uuid;

    -- Get plan details
    SELECT * INTO old_plan FROM subscription_plans WHERE id = current_subscription.plan_id;
    SELECT * INTO new_plan FROM subscription_plans WHERE id = new_plan_id;

    -- Update subscription
    UPDATE workspace_subscriptions 
    SET 
        plan_id = new_plan_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE workspace_id = workspace_uuid;

    -- Update storage quota based on new plan
    UPDATE storage_quotas
    SET
        max_storage_bytes = new_plan.max_storage_mb * 1024 * 1024,
        max_file_size = new_plan.max_file_size,
        updated_at = CURRENT_TIMESTAMP
    WHERE workspace_id = workspace_uuid;

    -- Record subscription change
    INSERT INTO subscription_changes (
        subscription_id,
        change_type,
        old_plan_id,
        new_plan_id,
        effective_date,
        reason,
        created_at
    ) VALUES (
        current_subscription.id,
        CASE 
            WHEN new_plan.price > old_plan.price THEN 'upgrade'
            WHEN new_plan.price < old_plan.price THEN 'downgrade'
            ELSE 'plan_change'
        END,
        old_plan.id,
        new_plan.id,
        effective_date,
        'user_request',
        CURRENT_TIMESTAMP
    );

    -- Create audit log
    INSERT INTO audit_logs (
        workspace_id,
        action,
        resource,
        resource_id,
        category,
        details,
        outcome
    ) VALUES (
        workspace_uuid,
        'update',
        'subscription',
        current_subscription.id,
        'billing',
        jsonb_build_object(
            'old_plan', old_plan.name,
            'new_plan', new_plan.name,
            'effective_date', effective_date
        ),
        'success'
    );

    RAISE NOTICE 'Workspace % subscription upgraded from % to %', workspace_uuid, old_plan.name, new_plan.name;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- UTILITY FUNCTIONS
-- =======================================================

-- Function to check if workspace is properly initialized
CREATE OR REPLACE FUNCTION validate_workspace_initialization(workspace_uuid UUID)
RETURNS TABLE (
    component VARCHAR(50),
    exists BOOLEAN,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'workspace_settings'::VARCHAR(50) as component,
        EXISTS(SELECT 1 FROM workspace_settings WHERE workspace_id = workspace_uuid) as exists,
        'Default processing options and file type restrictions'::TEXT as details
    UNION ALL
    SELECT 
        'storage_quota'::VARCHAR(50),
        EXISTS(SELECT 1 FROM storage_quotas WHERE workspace_id = workspace_uuid),
        'Storage limits and usage tracking'::TEXT
    UNION ALL
    SELECT 
        'subscription'::VARCHAR(50),
        EXISTS(SELECT 1 FROM workspace_subscriptions WHERE workspace_id = workspace_uuid),
        'Active subscription plan assignment'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is properly initialized
CREATE OR REPLACE FUNCTION validate_user_initialization(user_uuid UUID)
RETURNS TABLE (
    component VARCHAR(50),
    exists BOOLEAN,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'user_settings'::VARCHAR(50) as component,
        EXISTS(SELECT 1 FROM user_settings WHERE user_id = user_uuid) as exists,
        'User preferences and default options'::TEXT as details
    UNION ALL
    SELECT 
        'user_quota'::VARCHAR(50),
        EXISTS(SELECT 1 FROM user_quotas WHERE user_id = user_uuid),
        'Usage limits and tracking'::TEXT
    UNION ALL
    SELECT 
        'alert_rules'::VARCHAR(50),
        EXISTS(SELECT 1 FROM alert_rules WHERE user_id = user_uuid),
        'Default notification rules'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to create a complete workspace with owner
CREATE OR REPLACE FUNCTION create_workspace_with_owner(
    workspace_name VARCHAR(255),
    workspace_slug VARCHAR(100),
    workspace_description TEXT,
    owner_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    new_workspace_id UUID := gen_random_uuid();
BEGIN
    -- Create the workspace
    INSERT INTO workspaces (
        id,
        name,
        slug,
        description,
        created_at,
        updated_at,
        is_active
    ) VALUES (
        new_workspace_id,
        workspace_name,
        workspace_slug,
        workspace_description,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        true
    );

    -- The triggers will automatically initialize the workspace
    -- Now set up the owner
    PERFORM setup_workspace_owner(new_workspace_id, owner_user_id);

    RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- BACKFILL FUNCTIONS FOR EXISTING DATA
-- =======================================================

-- Function to backfill missing workspace initialization for existing workspaces
CREATE OR REPLACE FUNCTION backfill_workspace_initialization()
RETURNS TABLE (
    workspace_id UUID,
    components_created TEXT[]
) AS $$
DECLARE
    workspace_record workspaces%ROWTYPE;
    created_components TEXT[] := '{}';
BEGIN
    FOR workspace_record IN SELECT * FROM workspaces WHERE is_active = true LOOP
        created_components := '{}';
        
        -- Check and create workspace settings
        IF NOT EXISTS(SELECT 1 FROM workspace_settings WHERE workspace_id = workspace_record.id) THEN
            PERFORM create_default_workspace_settings(workspace_record.id);
            created_components := array_append(created_components, 'workspace_settings');
        END IF;
        
        -- Check and create storage quota
        IF NOT EXISTS(SELECT 1 FROM storage_quotas WHERE workspace_id = workspace_record.id) THEN
            INSERT INTO storage_quotas (
                workspace_id, max_storage_bytes, max_file_count, max_file_size,
                current_storage_bytes, current_file_count
            ) VALUES (
                workspace_record.id, 104857600, 100, 26214400, 0, 0
            );
            created_components := array_append(created_components, 'storage_quota');
        END IF;
        
        -- Check and create subscription if missing
        IF NOT EXISTS(SELECT 1 FROM workspace_subscriptions WHERE workspace_id = workspace_record.id) THEN
            INSERT INTO workspace_subscriptions (
                workspace_id, plan_id, status, current_period_start, current_period_end
            ) VALUES (
                workspace_record.id,
                (SELECT id FROM subscription_plans WHERE plan_code = 'free' LIMIT 1),
                'active',
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '1 month'
            );
            created_components := array_append(created_components, 'subscription');
        END IF;
        
        RETURN QUERY SELECT workspace_record.id, created_components;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to backfill missing user initialization for existing users
CREATE OR REPLACE FUNCTION backfill_user_initialization()
RETURNS TABLE (
    user_id UUID,
    components_created TEXT[]
) AS $$
DECLARE
    user_record users%ROWTYPE;
    created_components TEXT[] := '{}';
BEGIN
    FOR user_record IN SELECT * FROM users WHERE is_active = true LOOP
        created_components := '{}';
        
        -- Check and create user settings
        IF NOT EXISTS(SELECT 1 FROM user_settings WHERE user_id = user_record.id) THEN
            INSERT INTO user_settings (user_id, settings_json) VALUES (
                user_record.id,
                '{"theme": "light", "language": "en", "email_notifications": true}'::jsonb
            );
            created_components := array_append(created_components, 'user_settings');
        END IF;
        
        -- Check and create user quota
        IF NOT EXISTS(SELECT 1 FROM user_quotas WHERE user_id = user_record.id) THEN
            INSERT INTO user_quotas (
                user_id, period_start, period_end, api_calls_limit, tokens_limit, 
                storage_limit_mb, processing_minutes_limit
            ) VALUES (
                user_record.id,
                DATE_TRUNC('month', CURRENT_DATE),
                DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
                100, 10000, 100, 30
            );
            created_components := array_append(created_components, 'user_quota');
        END IF;
        
        RETURN QUERY SELECT user_record.id, created_components;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- MONITORING AND VALIDATION
-- =======================================================

-- View to monitor initialization status
CREATE OR REPLACE VIEW workspace_initialization_status AS
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    w.created_at,
    EXISTS(SELECT 1 FROM workspace_settings ws WHERE ws.workspace_id = w.id) as has_settings,
    EXISTS(SELECT 1 FROM storage_quotas sq WHERE sq.workspace_id = w.id) as has_quota,
    EXISTS(SELECT 1 FROM workspace_subscriptions sub WHERE sub.workspace_id = w.id) as has_subscription,
    CASE 
        WHEN EXISTS(SELECT 1 FROM workspace_settings ws WHERE ws.workspace_id = w.id)
         AND EXISTS(SELECT 1 FROM storage_quotas sq WHERE sq.workspace_id = w.id)
         AND EXISTS(SELECT 1 FROM workspace_subscriptions sub WHERE sub.workspace_id = w.id)
        THEN 'complete'
        ELSE 'incomplete'
    END as initialization_status
FROM workspaces w
WHERE w.is_active = true;

CREATE OR REPLACE VIEW user_initialization_status AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.created_at,
    EXISTS(SELECT 1 FROM user_settings us WHERE us.user_id = u.id) as has_settings,
    EXISTS(SELECT 1 FROM user_quotas uq WHERE uq.user_id = u.id) as has_quota,
    EXISTS(SELECT 1 FROM alert_rules ar WHERE ar.user_id = u.id) as has_alerts,
    CASE 
        WHEN EXISTS(SELECT 1 FROM user_settings us WHERE us.user_id = u.id)
         AND EXISTS(SELECT 1 FROM user_quotas uq WHERE uq.user_id = u.id)
        THEN 'complete'
        ELSE 'incomplete'
    END as initialization_status
FROM users u
WHERE u.is_active = true;

RAISE NOTICE 'AudioTricks user and workspace automation system installed successfully!';
RAISE NOTICE 'Key features:';
RAISE NOTICE '- Automatic workspace initialization with Free tier subscription';
RAISE NOTICE '- Automatic user initialization with default settings and quotas'; 
RAISE NOTICE '- Subscription management and upgrade functions';
RAISE NOTICE '- Validation and monitoring views';
RAISE NOTICE '- Backfill functions for existing data';