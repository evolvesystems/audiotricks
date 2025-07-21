-- AudioTricks User-Specific Plan Assignment System
-- This file implements individual user plan assignment and workspace team member access control

-- =======================================================
-- USER SUBSCRIPTION MODEL - Individual Plan Assignment
-- =======================================================

-- Add user subscription table for individual user plans
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription Details
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'paused')),
    subscription_type VARCHAR(20) DEFAULT 'personal' CHECK (subscription_type IN ('personal', 'assigned', 'inherited')),
    
    -- Billing & Period
    current_period_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month'),
    next_billing_date TIMESTAMP,
    
    -- Assignment Context (when assigned by workspace owner)
    assigned_by_user_id UUID REFERENCES users(id),
    assigned_by_workspace_id UUID REFERENCES workspaces(id),
    assignment_reason TEXT,
    
    -- Payment Integration
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, plan_id, status) WHERE status = 'active'
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_assigned_by ON user_subscriptions(assigned_by_workspace_id, assigned_by_user_id);

-- =======================================================
-- PLAN INHERITANCE & RESOLUTION SYSTEM
-- =======================================================

-- Plan hierarchy rules for resolving conflicts between user and workspace plans
CREATE TABLE IF NOT EXISTS plan_hierarchy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule Configuration
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Resolution Strategy
    resolution_strategy VARCHAR(50) NOT NULL CHECK (resolution_strategy IN ('user_overrides', 'workspace_overrides', 'highest_plan', 'most_permissive')),
    
    -- Conditions
    applies_to_user_types VARCHAR[] DEFAULT ARRAY['all'], -- e.g., ['owner', 'admin'] or ['all']
    applies_to_workspace_types VARCHAR[] DEFAULT ARRAY['all'], -- e.g., ['enterprise', 'team'] or ['all']
    applies_to_plan_categories VARCHAR[] DEFAULT ARRAY['all'], -- e.g., ['personal', 'business'] or ['all']
    
    -- Priority and Status
    priority_order INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default hierarchy rules
INSERT INTO plan_hierarchy_rules (rule_name, description, resolution_strategy, priority_order) VALUES
('user_plan_priority', 'User-assigned plans take priority over workspace default plans', 'user_overrides', 1),
('workspace_owner_authority', 'Workspace owners can override user plans for their workspace', 'workspace_overrides', 2),
('highest_limits_default', 'When in doubt, use the plan with highest limits', 'highest_plan', 10);

-- Enhanced WorkspaceUser model to track plan inheritance
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS effective_plan_id UUID REFERENCES subscription_plans(id);
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS plan_inherited_from VARCHAR(20) CHECK (plan_inherited_from IN ('user_subscription', 'workspace_subscription', 'default_assignment'));
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS plan_overridden_by_owner BOOLEAN DEFAULT false;
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS plan_override_reason TEXT;
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =======================================================
-- PLAN RESOLUTION FUNCTIONS
-- =======================================================

-- Function to resolve effective plan for a user in a specific workspace
CREATE OR REPLACE FUNCTION resolve_user_effective_plan(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    effective_plan_id UUID,
    effective_plan_name TEXT,
    plan_source TEXT, -- 'user_subscription', 'workspace_subscription', 'free_default'
    plan_limits JSONB,
    resolution_reason TEXT
) AS $$
DECLARE
    user_plan RECORD;
    workspace_plan RECORD;
    workspace_user_override RECORD;
    hierarchy_rule RECORD;
    resolution_strategy TEXT;
    final_plan RECORD;
    limits_json JSONB;
BEGIN
    -- Get user's personal subscription
    SELECT us.*, sp.name as plan_name, sp.max_transcriptions_monthly, sp.max_files_daily, 
           sp.max_files_monthly, sp.max_concurrent_jobs, sp.max_voice_synthesis_monthly
    INTO user_plan
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_uuid 
        AND us.status = 'active'
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- Get workspace subscription (if workspace specified)
    IF workspace_uuid IS NOT NULL THEN
        SELECT ws.*, sp.name as plan_name, sp.max_transcriptions_monthly, sp.max_files_daily,
               sp.max_files_monthly, sp.max_concurrent_jobs, sp.max_voice_synthesis_monthly
        INTO workspace_plan
        FROM workspace_subscriptions ws
        JOIN subscription_plans sp ON ws.plan_id = sp.id
        WHERE ws.workspace_id = workspace_uuid 
            AND ws.status = 'active';
        
        -- Check for workspace owner overrides
        SELECT wu.*, wu.effective_plan_id, wu.plan_overridden_by_owner
        INTO workspace_user_override
        FROM workspace_users wu
        WHERE wu.user_id = user_uuid 
            AND wu.workspace_id = workspace_uuid;
    END IF;
    
    -- Get applicable hierarchy rule
    SELECT resolution_strategy INTO resolution_strategy
    FROM plan_hierarchy_rules
    WHERE is_active = true
        AND ('all' = ANY(applies_to_user_types) OR 
             (workspace_user_override.role IS NOT NULL AND workspace_user_override.role = ANY(applies_to_user_types)))
    ORDER BY priority_order
    LIMIT 1;
    
    -- Apply resolution strategy
    CASE resolution_strategy
        WHEN 'user_overrides' THEN
            IF user_plan.id IS NOT NULL THEN
                final_plan := user_plan;
                RETURN QUERY SELECT 
                    user_plan.plan_id, user_plan.plan_name, 'user_subscription'::TEXT,
                    jsonb_build_object(
                        'max_transcriptions_monthly', user_plan.max_transcriptions_monthly,
                        'max_files_daily', user_plan.max_files_daily,
                        'max_files_monthly', user_plan.max_files_monthly,
                        'max_concurrent_jobs', user_plan.max_concurrent_jobs,
                        'max_voice_synthesis_monthly', user_plan.max_voice_synthesis_monthly
                    ),
                    'User has active personal subscription'::TEXT;
                RETURN;
            END IF;
            
        WHEN 'workspace_overrides' THEN
            IF workspace_user_override.plan_overridden_by_owner = true AND workspace_user_override.effective_plan_id IS NOT NULL THEN
                SELECT sp.id, sp.name, sp.max_transcriptions_monthly, sp.max_files_daily,
                       sp.max_files_monthly, sp.max_concurrent_jobs, sp.max_voice_synthesis_monthly
                INTO final_plan
                FROM subscription_plans sp 
                WHERE sp.id = workspace_user_override.effective_plan_id;
                
                RETURN QUERY SELECT 
                    final_plan.id, final_plan.name, 'workspace_owner_override'::TEXT,
                    jsonb_build_object(
                        'max_transcriptions_monthly', final_plan.max_transcriptions_monthly,
                        'max_files_daily', final_plan.max_files_daily,
                        'max_files_monthly', final_plan.max_files_monthly,
                        'max_concurrent_jobs', final_plan.max_concurrent_jobs,
                        'max_voice_synthesis_monthly', final_plan.max_voice_synthesis_monthly
                    ),
                    'Plan assigned by workspace owner'::TEXT;
                RETURN;
            END IF;
            
        WHEN 'highest_plan' THEN
            -- Compare user plan vs workspace plan and choose higher limits
            IF user_plan.id IS NOT NULL AND workspace_plan.id IS NOT NULL THEN
                IF user_plan.max_transcriptions_monthly >= workspace_plan.max_transcriptions_monthly THEN
                    final_plan := user_plan;
                    RETURN QUERY SELECT 
                        user_plan.plan_id, user_plan.plan_name, 'user_subscription'::TEXT,
                        jsonb_build_object(
                            'max_transcriptions_monthly', user_plan.max_transcriptions_monthly,
                            'max_files_daily', user_plan.max_files_daily,
                            'max_files_monthly', user_plan.max_files_monthly,
                            'max_concurrent_jobs', user_plan.max_concurrent_jobs,
                            'max_voice_synthesis_monthly', user_plan.max_voice_synthesis_monthly
                        ),
                        'User plan has higher limits than workspace plan'::TEXT;
                    RETURN;
                ELSE
                    final_plan := workspace_plan;
                    RETURN QUERY SELECT 
                        workspace_plan.plan_id, workspace_plan.plan_name, 'workspace_subscription'::TEXT,
                        jsonb_build_object(
                            'max_transcriptions_monthly', workspace_plan.max_transcriptions_monthly,
                            'max_files_daily', workspace_plan.max_files_daily,
                            'max_files_monthly', workspace_plan.max_files_monthly,
                            'max_concurrent_jobs', workspace_plan.max_concurrent_jobs,
                            'max_voice_synthesis_monthly', workspace_plan.max_voice_synthesis_monthly
                        ),
                        'Workspace plan has higher limits than user plan'::TEXT;
                    RETURN;
                END IF;
            END IF;
    END CASE;
    
    -- Fallback to workspace plan if available
    IF workspace_plan.id IS NOT NULL THEN
        RETURN QUERY SELECT 
            workspace_plan.plan_id, workspace_plan.plan_name, 'workspace_subscription'::TEXT,
            jsonb_build_object(
                'max_transcriptions_monthly', workspace_plan.max_transcriptions_monthly,
                'max_files_daily', workspace_plan.max_files_daily,
                'max_files_monthly', workspace_plan.max_files_monthly,
                'max_concurrent_jobs', workspace_plan.max_concurrent_jobs,
                'max_voice_synthesis_monthly', workspace_plan.max_voice_synthesis_monthly
            ),
            'Using workspace subscription plan'::TEXT;
        RETURN;
    END IF;
    
    -- Final fallback to free plan
    SELECT sp.id, sp.name, sp.max_transcriptions_monthly, sp.max_files_daily,
           sp.max_files_monthly, sp.max_concurrent_jobs, sp.max_voice_synthesis_monthly
    INTO final_plan
    FROM subscription_plans sp 
    WHERE sp.plan_code = 'free' AND sp.is_active = true;
    
    RETURN QUERY SELECT 
        final_plan.id, final_plan.name, 'free_default'::TEXT,
        jsonb_build_object(
            'max_transcriptions_monthly', final_plan.max_transcriptions_monthly,
            'max_files_daily', final_plan.max_files_daily,
            'max_files_monthly', final_plan.max_files_monthly,
            'max_concurrent_jobs', final_plan.max_concurrent_jobs,
            'max_voice_synthesis_monthly', final_plan.max_voice_synthesis_monthly
        ),
        'No user or workspace subscription, using free plan'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- USER PLAN ASSIGNMENT FUNCTIONS
-- =======================================================

-- Function for workspace owners to assign plans to team members
CREATE OR REPLACE FUNCTION assign_user_plan_by_workspace_owner(
    workspace_owner_uuid UUID,
    target_user_uuid UUID,
    workspace_uuid UUID,
    plan_uuid UUID,
    assignment_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    owner_check RECORD;
    target_user_check RECORD;
    plan_check RECORD;
    existing_subscription RECORD;
BEGIN
    -- Verify the requesting user is a workspace owner or admin
    SELECT wu.role INTO owner_check
    FROM workspace_users wu
    WHERE wu.user_id = workspace_owner_uuid 
        AND wu.workspace_id = workspace_uuid
        AND wu.role IN ('owner', 'admin');
    
    IF owner_check.role IS NULL THEN
        RAISE EXCEPTION 'User % is not an owner or admin of workspace %', workspace_owner_uuid, workspace_uuid;
    END IF;
    
    -- Verify target user is a member of the workspace
    SELECT wu.role INTO target_user_check
    FROM workspace_users wu
    WHERE wu.user_id = target_user_uuid 
        AND wu.workspace_id = workspace_uuid;
    
    IF target_user_check.role IS NULL THEN
        RAISE EXCEPTION 'Target user % is not a member of workspace %', target_user_uuid, workspace_uuid;
    END IF;
    
    -- Verify the plan exists and is active
    SELECT sp.name INTO plan_check
    FROM subscription_plans sp
    WHERE sp.id = plan_uuid AND sp.is_active = true;
    
    IF plan_check.name IS NULL THEN
        RAISE EXCEPTION 'Plan % does not exist or is not active', plan_uuid;
    END IF;
    
    -- Check for existing active user subscription
    SELECT id INTO existing_subscription
    FROM user_subscriptions
    WHERE user_id = target_user_uuid 
        AND status = 'active';
    
    -- Cancel existing subscription if it exists
    IF existing_subscription.id IS NOT NULL THEN
        UPDATE user_subscriptions
        SET status = 'cancelled',
            cancelled_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = existing_subscription.id;
    END IF;
    
    -- Create new assigned subscription
    INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        subscription_type,
        assigned_by_user_id,
        assigned_by_workspace_id,
        assignment_reason,
        current_period_start,
        current_period_end,
        activated_at
    ) VALUES (
        target_user_uuid,
        plan_uuid,
        'active',
        'assigned',
        workspace_owner_uuid,
        workspace_uuid,
        COALESCE(assignment_reason, 'Assigned by workspace owner'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 month',
        CURRENT_TIMESTAMP
    );
    
    -- Update workspace user effective plan
    UPDATE workspace_users
    SET effective_plan_id = plan_uuid,
        plan_inherited_from = 'user_subscription',
        plan_overridden_by_owner = true,
        plan_override_reason = assignment_reason,
        plan_updated_at = CURRENT_TIMESTAMP
    WHERE user_id = target_user_uuid AND workspace_id = workspace_uuid;
    
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
        workspace_owner_uuid,
        workspace_uuid,
        'assign_user_plan',
        'user_subscription',
        target_user_uuid,
        'plan_management',
        jsonb_build_object(
            'target_user', target_user_uuid,
            'assigned_plan', plan_uuid,
            'assignment_reason', assignment_reason
        ),
        'success'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function for users to self-assign personal plans
CREATE OR REPLACE FUNCTION assign_personal_plan(
    user_uuid UUID,
    plan_uuid UUID,
    stripe_subscription_id_val VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    plan_check RECORD;
    existing_subscription RECORD;
    new_subscription_id UUID;
BEGIN
    -- Verify the plan exists and is active
    SELECT sp.name, sp.plan_category INTO plan_check
    FROM subscription_plans sp
    WHERE sp.id = plan_uuid AND sp.is_active = true;
    
    IF plan_check.name IS NULL THEN
        RAISE EXCEPTION 'Plan % does not exist or is not active', plan_uuid;
    END IF;
    
    -- Check for existing active user subscription
    SELECT id INTO existing_subscription
    FROM user_subscriptions
    WHERE user_id = user_uuid 
        AND status = 'active'
        AND subscription_type = 'personal';
    
    -- Cancel existing personal subscription if it exists
    IF existing_subscription.id IS NOT NULL THEN
        UPDATE user_subscriptions
        SET status = 'cancelled',
            cancelled_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = existing_subscription.id;
    END IF;
    
    -- Create new personal subscription
    INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        subscription_type,
        stripe_subscription_id,
        current_period_start,
        current_period_end,
        activated_at
    ) VALUES (
        user_uuid,
        plan_uuid,
        'active',
        'personal',
        stripe_subscription_id_val,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 month',
        CURRENT_TIMESTAMP
    ) RETURNING id INTO new_subscription_id;
    
    -- Update all workspace memberships to reflect new plan
    UPDATE workspace_users
    SET effective_plan_id = plan_uuid,
        plan_inherited_from = 'user_subscription',
        plan_overridden_by_owner = false,
        plan_updated_at = CURRENT_TIMESTAMP
    WHERE user_id = user_uuid 
        AND plan_overridden_by_owner = false; -- Don't override workspace owner assignments
    
    -- Create audit log
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
        'assign_personal_plan',
        'user_subscription',
        new_subscription_id,
        'plan_management',
        jsonb_build_object(
            'plan_id', plan_uuid,
            'stripe_subscription_id', stripe_subscription_id_val
        ),
        'success'
    );
    
    RETURN new_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- TEAM MEMBER MANAGEMENT FUNCTIONS
-- =======================================================

-- Function to get workspace team members with their effective plans
CREATE OR REPLACE FUNCTION get_workspace_team_members(
    workspace_uuid UUID,
    requesting_user_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    email TEXT,
    role TEXT,
    effective_plan_id UUID,
    effective_plan_name TEXT,
    plan_source TEXT,
    plan_limits JSONB,
    can_modify_plan BOOLEAN,
    joined_at TIMESTAMP,
    last_active_at TIMESTAMP
) AS $$
DECLARE
    requester_role TEXT;
BEGIN
    -- Check if requesting user has permission to view team members
    IF requesting_user_uuid IS NOT NULL THEN
        SELECT wu.role INTO requester_role
        FROM workspace_users wu
        WHERE wu.user_id = requesting_user_uuid 
            AND wu.workspace_id = workspace_uuid;
        
        IF requester_role IS NULL THEN
            RAISE EXCEPTION 'User % does not have access to workspace %', requesting_user_uuid, workspace_uuid;
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.email,
        wu.role,
        ep.effective_plan_id,
        ep.effective_plan_name,
        ep.plan_source,
        ep.plan_limits,
        (requester_role IN ('owner', 'admin') AND wu.role != 'owner') as can_modify_plan,
        wu.joined_at,
        wu.last_active_at
    FROM workspace_users wu
    JOIN users u ON wu.user_id = u.id
    LEFT JOIN LATERAL resolve_user_effective_plan(u.id, workspace_uuid) ep ON true
    WHERE wu.workspace_id = workspace_uuid
        AND u.is_active = true
    ORDER BY 
        CASE wu.role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'member' THEN 3 
        END,
        u.username;
END;
$$ LANGUAGE plpgsql;

-- Function to invite team member with specific plan
CREATE OR REPLACE FUNCTION invite_team_member_with_plan(
    workspace_uuid UUID,
    inviter_user_uuid UUID,
    invitee_email TEXT,
    role_val TEXT DEFAULT 'member',
    assigned_plan_id UUID DEFAULT NULL,
    invitation_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    inviter_role TEXT;
    invitation_id UUID;
    invitation_token TEXT;
    plan_name TEXT;
BEGIN
    -- Verify inviter has permission
    SELECT wu.role INTO inviter_role
    FROM workspace_users wu
    WHERE wu.user_id = inviter_user_uuid 
        AND wu.workspace_id = workspace_uuid;
    
    IF inviter_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'User % does not have permission to invite members to workspace %', inviter_user_uuid, workspace_uuid;
    END IF;
    
    -- Validate plan if specified
    IF assigned_plan_id IS NOT NULL THEN
        SELECT sp.name INTO plan_name
        FROM subscription_plans sp
        WHERE sp.id = assigned_plan_id AND sp.is_active = true;
        
        IF plan_name IS NULL THEN
            RAISE EXCEPTION 'Plan % does not exist or is not active', assigned_plan_id;
        END IF;
    END IF;
    
    -- Generate invitation token
    invitation_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create workspace invitation
    INSERT INTO workspace_invitations (
        workspace_id,
        email,
        role,
        token,
        expires_at,
        invited_by_id
    ) VALUES (
        workspace_uuid,
        invitee_email,
        role_val,
        invitation_token,
        CURRENT_TIMESTAMP + INTERVAL '7 days',
        inviter_user_uuid
    ) RETURNING id INTO invitation_id;
    
    -- Store plan assignment in metadata if specified
    IF assigned_plan_id IS NOT NULL THEN
        -- We'll store the plan assignment intention in invitation metadata
        -- It will be applied when the invitation is accepted
        UPDATE workspace_invitations
        SET metadata = jsonb_build_object(
            'assigned_plan_id', assigned_plan_id,
            'assigned_plan_name', plan_name,
            'invitation_message', invitation_message
        )
        WHERE id = invitation_id;
    END IF;
    
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
        inviter_user_uuid,
        workspace_uuid,
        'invite_team_member',
        'workspace_invitation',
        invitation_id,
        'team_management',
        jsonb_build_object(
            'invitee_email', invitee_email,
            'role', role_val,
            'assigned_plan_id', assigned_plan_id,
            'invitation_message', invitation_message
        ),
        'success'
    );
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- USER PLAN QUOTA ENFORCEMENT (Enhanced)
-- =======================================================

-- Enhanced quota checking that considers user-specific plans
CREATE OR REPLACE FUNCTION check_user_transcription_quota(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    can_proceed BOOLEAN,
    current_usage BIGINT,
    limit_amount BIGINT,
    usage_percentage DECIMAL(5,2),
    plan_source TEXT,
    reset_date DATE
) AS $$
DECLARE
    effective_plan RECORD;
    current_period_usage BIGINT;
    usage_pct DECIMAL;
BEGIN
    -- Get effective plan for user
    SELECT * INTO effective_plan
    FROM resolve_user_effective_plan(user_uuid, workspace_uuid)
    LIMIT 1;
    
    -- Get current usage for this period
    SELECT COALESCE(SUM(transcriptions_used), 0) INTO current_period_usage
    FROM usage_counters
    WHERE user_id = user_uuid
        AND (workspace_id = workspace_uuid OR (workspace_id IS NULL AND workspace_uuid IS NULL))
        AND period_type = 'monthly'
        AND period_start = DATE_TRUNC('month', CURRENT_DATE);
    
    -- Calculate usage percentage
    usage_pct := CASE 
        WHEN (effective_plan.plan_limits->>'max_transcriptions_monthly')::BIGINT = -1 THEN 0
        WHEN (effective_plan.plan_limits->>'max_transcriptions_monthly')::BIGINT = 0 THEN 100
        ELSE (current_period_usage::DECIMAL / (effective_plan.plan_limits->>'max_transcriptions_monthly')::BIGINT) * 100
    END;
    
    RETURN QUERY SELECT
        -- Can proceed if unlimited (-1) or under limit
        ((effective_plan.plan_limits->>'max_transcriptions_monthly')::BIGINT = -1 OR 
         current_period_usage < (effective_plan.plan_limits->>'max_transcriptions_monthly')::BIGINT),
        current_period_usage,
        (effective_plan.plan_limits->>'max_transcriptions_monthly')::BIGINT,
        usage_pct,
        effective_plan.plan_source,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- MONITORING AND ANALYTICS VIEWS
-- =======================================================

-- View for user plan management dashboard
CREATE OR REPLACE VIEW user_plan_dashboard AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    us.id as subscription_id,
    sp.name as plan_name,
    sp.plan_category,
    us.subscription_type,
    us.status,
    us.current_period_start,
    us.current_period_end,
    
    -- Assignment context
    us.assigned_by_user_id,
    assigner.username as assigned_by_username,
    us.assigned_by_workspace_id,
    w.name as assigned_by_workspace_name,
    us.assignment_reason,
    
    -- Usage summary for current month
    uc.transcriptions_used,
    uc.files_uploaded,
    uc.voice_synthesis_used,
    
    -- Utilization percentages
    CASE 
        WHEN sp.max_transcriptions_monthly = -1 THEN 0
        ELSE (COALESCE(uc.transcriptions_used, 0)::FLOAT / NULLIF(sp.max_transcriptions_monthly, 0)) * 100
    END as transcription_utilization,
    
    us.created_at,
    us.activated_at,
    us.cancelled_at
    
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN users assigner ON us.assigned_by_user_id = assigner.id
LEFT JOIN workspaces w ON us.assigned_by_workspace_id = w.id
LEFT JOIN usage_counters uc ON (
    us.user_id = uc.user_id
    AND uc.period_type = 'monthly'
    AND uc.period_start = DATE_TRUNC('month', CURRENT_DATE)
)
WHERE us.status IN ('active', 'past_due')
ORDER BY us.created_at DESC;

-- View for workspace team plan overview
CREATE OR REPLACE VIEW workspace_team_plan_overview AS
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    u.id as user_id,
    u.username,
    u.email,
    wu.role,
    
    -- Effective plan information
    ep.effective_plan_name,
    ep.plan_source,
    ep.resolution_reason,
    
    -- Plan limits
    ep.plan_limits,
    
    -- Override information
    wu.plan_overridden_by_owner,
    wu.plan_override_reason,
    wu.plan_updated_at,
    
    wu.joined_at,
    wu.last_active_at
    
FROM workspaces w
JOIN workspace_users wu ON w.id = wu.workspace_id
JOIN users u ON wu.user_id = u.id
LEFT JOIN LATERAL resolve_user_effective_plan(u.id, w.id) ep ON true
WHERE u.is_active = true
ORDER BY w.name, wu.role, u.username;

RAISE NOTICE 'User-specific plan assignment system installed successfully!';
RAISE NOTICE 'Key features:';
RAISE NOTICE '- user_subscriptions table - Individual user plan assignments';
RAISE NOTICE '- resolve_user_effective_plan() - Smart plan resolution with inheritance';
RAISE NOTICE '- assign_user_plan_by_workspace_owner() - Workspace owners can assign plans to team members';
RAISE NOTICE '- assign_personal_plan() - Users can self-assign personal plans';
RAISE NOTICE '- get_workspace_team_members() - Team member management with plan visibility';
RAISE NOTICE '- invite_team_member_with_plan() - Invite with pre-assigned plan';
RAISE NOTICE '- check_user_transcription_quota() - User-specific quota enforcement';
RAISE NOTICE '- user_plan_dashboard view - User plan management dashboard';
RAISE NOTICE '- workspace_team_plan_overview view - Team plan overview';