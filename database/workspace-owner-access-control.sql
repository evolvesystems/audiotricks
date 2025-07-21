-- AudioTricks Workspace Owner Access Control System
-- This file implements comprehensive access control for workspace owners to manage team member plans

-- =======================================================
-- WORKSPACE OWNER PERMISSION VALIDATION
-- =======================================================

-- Function to validate workspace owner permissions for plan management
CREATE OR REPLACE FUNCTION validate_workspace_owner_permissions(
    requesting_user_uuid UUID,
    workspace_uuid UUID,
    target_user_uuid UUID DEFAULT NULL,
    required_action TEXT DEFAULT 'manage_team'
)
RETURNS TABLE (
    has_permission BOOLEAN,
    user_role TEXT,
    permission_details JSONB,
    restriction_reason TEXT
) AS $$
DECLARE
    requester_role TEXT;
    target_role TEXT;
    workspace_info RECORD;
    permission_granted BOOLEAN := false;
    details JSONB;
    restriction TEXT := NULL;
BEGIN
    -- Get workspace information
    SELECT w.*, ws.status as subscription_status, sp.plan_category
    INTO workspace_info
    FROM workspaces w
    LEFT JOIN workspace_subscriptions ws ON w.id = ws.workspace_id AND ws.status = 'active'
    LEFT JOIN subscription_plans sp ON ws.plan_id = sp.id
    WHERE w.id = workspace_uuid;
    
    IF workspace_info.id IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, '{}'::JSONB, 'Workspace not found'::TEXT;
        RETURN;
    END IF;
    
    -- Get requester's role in workspace
    SELECT wu.role INTO requester_role
    FROM workspace_users wu
    WHERE wu.user_id = requesting_user_uuid 
        AND wu.workspace_id = workspace_uuid;
    
    IF requester_role IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, '{}'::JSONB, 'User is not a member of this workspace'::TEXT;
        RETURN;
    END IF;
    
    -- Get target user's role if specified
    IF target_user_uuid IS NOT NULL THEN
        SELECT wu.role INTO target_role
        FROM workspace_users wu
        WHERE wu.user_id = target_user_uuid 
            AND wu.workspace_id = workspace_uuid;
        
        IF target_role IS NULL THEN
            RETURN QUERY SELECT false, requester_role, '{}'::JSONB, 'Target user is not a member of this workspace'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Check permissions based on action and roles
    CASE required_action
        WHEN 'manage_team' THEN
            permission_granted := requester_role IN ('owner', 'admin');
            IF NOT permission_granted THEN
                restriction := 'Only workspace owners and admins can manage team members';
            END IF;
            
        WHEN 'assign_plans' THEN
            permission_granted := requester_role IN ('owner', 'admin');
            IF NOT permission_granted THEN
                restriction := 'Only workspace owners and admins can assign plans to team members';
            ELSIF target_role = 'owner' AND requester_role != 'owner' THEN
                permission_granted := false;
                restriction := 'Only workspace owners can modify other owners'' plans';
            END IF;
            
        WHEN 'invite_members' THEN
            permission_granted := requester_role IN ('owner', 'admin');
            IF NOT permission_granted THEN
                restriction := 'Only workspace owners and admins can invite new members';
            END IF;
            
        WHEN 'remove_members' THEN
            permission_granted := requester_role IN ('owner', 'admin');
            IF NOT permission_granted THEN
                restriction := 'Only workspace owners and admins can remove team members';
            ELSIF target_role = 'owner' AND requester_role != 'owner' THEN
                permission_granted := false;
                restriction := 'Only workspace owners can remove other owners';
            ELSIF target_user_uuid = requesting_user_uuid THEN
                -- Users can always remove themselves (leave workspace)
                permission_granted := true;
                restriction := NULL;
            END IF;
            
        WHEN 'modify_workspace' THEN
            permission_granted := requester_role = 'owner';
            IF NOT permission_granted THEN
                restriction := 'Only workspace owners can modify workspace settings';
            END IF;
            
        WHEN 'view_team' THEN
            permission_granted := requester_role IN ('owner', 'admin', 'member');
            IF NOT permission_granted THEN
                restriction := 'All workspace members can view team information';
            END IF;
            
        ELSE
            permission_granted := false;
            restriction := format('Unknown action: %s', required_action);
    END CASE;
    
    -- Build permission details
    details := jsonb_build_object(
        'workspace_id', workspace_uuid,
        'requester_role', requester_role,
        'target_role', target_role,
        'workspace_subscription_status', workspace_info.subscription_status,
        'workspace_plan_category', workspace_info.plan_category,
        'action_requested', required_action,
        'permission_hierarchy', jsonb_build_object(
            'owner', 'Full access to all workspace features and team management',
            'admin', 'Team management, plan assignment, member invitation',
            'member', 'Basic workspace access, can view team but cannot manage'
        )
    );
    
    RETURN QUERY SELECT
        permission_granted,
        requester_role,
        details,
        restriction;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- SECURE TEAM MEMBER MANAGEMENT
-- =======================================================

-- Function to securely assign or change team member plans
CREATE OR REPLACE FUNCTION secure_assign_team_member_plan(
    requesting_user_uuid UUID,
    target_user_uuid UUID,
    workspace_uuid UUID,
    new_plan_uuid UUID,
    assignment_reason TEXT DEFAULT NULL,
    force_override BOOLEAN DEFAULT false
)
RETURNS TABLE (
    success BOOLEAN,
    assignment_id UUID,
    previous_plan_name TEXT,
    new_plan_name TEXT,
    effective_date TIMESTAMP,
    message TEXT
) AS $$
DECLARE
    permission_check RECORD;
    current_plan RECORD;
    new_plan RECORD;
    assignment_uuid UUID;
    existing_subscription RECORD;
    effective_timestamp TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- Validate permissions
    SELECT * INTO permission_check
    FROM validate_workspace_owner_permissions(
        requesting_user_uuid, 
        workspace_uuid, 
        target_user_uuid, 
        'assign_plans'
    );
    
    IF NOT permission_check.has_permission THEN
        RETURN QUERY SELECT 
            false, 
            NULL::UUID, 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TIMESTAMP,
            permission_check.restriction_reason;
        RETURN;
    END IF;
    
    -- Get current effective plan for target user
    SELECT * INTO current_plan
    FROM resolve_user_effective_plan(target_user_uuid, workspace_uuid);
    
    -- Validate new plan
    SELECT sp.* INTO new_plan
    FROM subscription_plans sp
    WHERE sp.id = new_plan_uuid AND sp.is_active = true;
    
    IF new_plan.id IS NULL THEN
        RETURN QUERY SELECT 
            false, 
            NULL::UUID, 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TIMESTAMP,
            'Selected plan does not exist or is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check if assignment would be redundant
    IF current_plan.effective_plan_id = new_plan_uuid AND NOT force_override THEN
        RETURN QUERY SELECT 
            false, 
            NULL::UUID, 
            current_plan.effective_plan_name, 
            new_plan.name, 
            NULL::TIMESTAMP,
            'User already has this plan assigned'::TEXT;
        RETURN;
    END IF;
    
    -- Handle existing user subscriptions
    SELECT us.* INTO existing_subscription
    FROM user_subscriptions us
    WHERE us.user_id = target_user_uuid 
        AND us.status = 'active'
        AND (us.assigned_by_workspace_id = workspace_uuid OR us.subscription_type = 'personal');
    
    -- Cancel existing workspace-assigned subscription
    IF existing_subscription.id IS NOT NULL AND existing_subscription.assigned_by_workspace_id = workspace_uuid THEN
        UPDATE user_subscriptions
        SET status = 'cancelled',
            cancelled_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = existing_subscription.id;
    END IF;
    
    -- Create new assignment
    assignment_uuid := assign_user_plan_by_workspace_owner(
        requesting_user_uuid,
        target_user_uuid,
        workspace_uuid,
        new_plan_uuid,
        assignment_reason
    );
    
    -- Record detailed audit log
    INSERT INTO audit_logs (
        user_id,
        workspace_id,
        action,
        resource,
        resource_id,
        category,
        details,
        outcome,
        severity
    ) VALUES (
        requesting_user_uuid,
        workspace_uuid,
        'secure_plan_assignment',
        'team_member_plan',
        target_user_uuid,
        'team_management',
        jsonb_build_object(
            'target_user_id', target_user_uuid,
            'previous_plan', jsonb_build_object(
                'plan_id', current_plan.effective_plan_id,
                'plan_name', current_plan.effective_plan_name,
                'plan_source', current_plan.plan_source
            ),
            'new_plan', jsonb_build_object(
                'plan_id', new_plan_uuid,
                'plan_name', new_plan.name,
                'plan_category', new_plan.plan_category
            ),
            'assignment_reason', assignment_reason,
            'force_override', force_override,
            'permission_details', permission_check.permission_details
        ),
        'success',
        'info'
    );
    
    RETURN QUERY SELECT 
        true,
        assignment_uuid,
        current_plan.effective_plan_name,
        new_plan.name,
        effective_timestamp,
        format('Successfully assigned %s plan to user in workspace', new_plan.name);
END;
$$ LANGUAGE plpgsql;

-- Function to securely remove team member from workspace
CREATE OR REPLACE FUNCTION secure_remove_team_member(
    requesting_user_uuid UUID,
    target_user_uuid UUID,
    workspace_uuid UUID,
    removal_reason TEXT DEFAULT NULL,
    transfer_ownership BOOLEAN DEFAULT false,
    new_owner_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    actions_taken TEXT[]
) AS $$
DECLARE
    permission_check RECORD;
    target_user_info RECORD;
    actions_array TEXT[] := '{}';
    workspace_info RECORD;
BEGIN
    -- Validate permissions
    SELECT * INTO permission_check
    FROM validate_workspace_owner_permissions(
        requesting_user_uuid, 
        workspace_uuid, 
        target_user_uuid, 
        'remove_members'
    );
    
    IF NOT permission_check.has_permission THEN
        RETURN QUERY SELECT 
            false, 
            permission_check.restriction_reason,
            ARRAY[]::TEXT[];
        RETURN;
    END IF;
    
    -- Get target user information
    SELECT wu.*, u.username, u.email
    INTO target_user_info
    FROM workspace_users wu
    JOIN users u ON wu.user_id = u.id
    WHERE wu.user_id = target_user_uuid 
        AND wu.workspace_id = workspace_uuid;
    
    -- Get workspace information
    SELECT w.*, COUNT(wu.user_id) as member_count
    INTO workspace_info
    FROM workspaces w
    LEFT JOIN workspace_users wu ON w.id = wu.workspace_id
    WHERE w.id = workspace_uuid
    GROUP BY w.id, w.name, w.slug, w.description, w.created_at, w.updated_at, w.is_active;
    
    -- Special handling for workspace owners
    IF target_user_info.role = 'owner' THEN
        -- Check if this is the last owner
        IF (SELECT COUNT(*) FROM workspace_users WHERE workspace_id = workspace_uuid AND role = 'owner') = 1 THEN
            IF transfer_ownership AND new_owner_uuid IS NOT NULL THEN
                -- Transfer ownership first
                UPDATE workspace_users
                SET role = 'owner',
                    permissions = jsonb_build_object('transferred_ownership', true),
                    last_active_at = CURRENT_TIMESTAMP
                WHERE user_id = new_owner_uuid AND workspace_id = workspace_uuid;
                
                actions_array := array_append(actions_array, format('Transferred ownership to user %s', new_owner_uuid));
            ELSE
                RETURN QUERY SELECT 
                    false, 
                    'Cannot remove the last workspace owner without transferring ownership first',
                    ARRAY[]::TEXT[];
                RETURN;
            END IF;
        END IF;
    END IF;
    
    -- Cancel any workspace-assigned user subscriptions
    UPDATE user_subscriptions
    SET status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = target_user_uuid 
        AND assigned_by_workspace_id = workspace_uuid
        AND status = 'active';
    
    IF FOUND THEN
        actions_array := array_append(actions_array, 'Cancelled workspace-assigned user subscription');
    END IF;
    
    -- Remove workspace user relationship
    DELETE FROM workspace_users 
    WHERE user_id = target_user_uuid AND workspace_id = workspace_uuid;
    
    actions_array := array_append(actions_array, 'Removed user from workspace');
    
    -- Cancel any pending invitations from this user
    UPDATE workspace_invitations
    SET status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP
    WHERE workspace_id = workspace_uuid 
        AND invited_by_id = target_user_uuid
        AND status = 'pending';
    
    IF FOUND THEN
        actions_array := array_append(actions_array, 'Cancelled pending invitations sent by removed user');
    END IF;
    
    -- Create comprehensive audit log
    INSERT INTO audit_logs (
        user_id,
        workspace_id,
        action,
        resource,
        resource_id,
        category,
        details,
        outcome,
        severity
    ) VALUES (
        requesting_user_uuid,
        workspace_uuid,
        'secure_remove_team_member',
        'workspace_membership',
        target_user_uuid,
        'team_management',
        jsonb_build_object(
            'removed_user', jsonb_build_object(
                'user_id', target_user_uuid,
                'username', target_user_info.username,
                'email', target_user_info.email,
                'role', target_user_info.role
            ),
            'removal_reason', removal_reason,
            'transfer_ownership', transfer_ownership,
            'new_owner_id', new_owner_uuid,
            'workspace_member_count_after', workspace_info.member_count - 1,
            'actions_taken', actions_array,
            'permission_details', permission_check.permission_details
        ),
        'success',
        CASE WHEN target_user_info.role = 'owner' THEN 'warn' ELSE 'info' END
    );
    
    RETURN QUERY SELECT 
        true,
        format('Successfully removed %s (%s) from workspace', target_user_info.username, target_user_info.role),
        actions_array;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- TEAM MEMBER ROLE MANAGEMENT
-- =======================================================

-- Function to securely change team member role
CREATE OR REPLACE FUNCTION secure_change_team_member_role(
    requesting_user_uuid UUID,
    target_user_uuid UUID,
    workspace_uuid UUID,
    new_role TEXT,
    role_change_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    previous_role TEXT,
    new_role_assigned TEXT,
    effective_date TIMESTAMP,
    message TEXT
) AS $$
DECLARE
    permission_check RECORD;
    target_current_role TEXT;
    requester_role TEXT;
    role_hierarchy_valid BOOLEAN := false;
BEGIN
    -- Validate new role
    IF new_role NOT IN ('member', 'admin', 'owner') THEN
        RETURN QUERY SELECT 
            false, 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TIMESTAMP,
            format('Invalid role: %s. Must be member, admin, or owner', new_role);
        RETURN;
    END IF;
    
    -- Get current roles
    SELECT wu.role INTO target_current_role
    FROM workspace_users wu
    WHERE wu.user_id = target_user_uuid AND wu.workspace_id = workspace_uuid;
    
    SELECT wu.role INTO requester_role
    FROM workspace_users wu
    WHERE wu.user_id = requesting_user_uuid AND wu.workspace_id = workspace_uuid;
    
    -- Validate role change hierarchy
    CASE requester_role
        WHEN 'owner' THEN
            role_hierarchy_valid := true; -- Owners can assign any role
        WHEN 'admin' THEN
            role_hierarchy_valid := new_role IN ('member', 'admin') AND target_current_role != 'owner';
        ELSE
            role_hierarchy_valid := false;
    END CASE;
    
    -- Check permissions with role-specific validation
    SELECT * INTO permission_check
    FROM validate_workspace_owner_permissions(
        requesting_user_uuid, 
        workspace_uuid, 
        target_user_uuid, 
        'manage_team'
    );
    
    IF NOT permission_check.has_permission OR NOT role_hierarchy_valid THEN
        RETURN QUERY SELECT 
            false, 
            target_current_role, 
            NULL::TEXT, 
            NULL::TIMESTAMP,
            CASE 
                WHEN NOT permission_check.has_permission THEN permission_check.restriction_reason
                WHEN NOT role_hierarchy_valid THEN format('Insufficient privileges to assign role %s', new_role)
                ELSE 'Role change not permitted'
            END;
        RETURN;
    END IF;
    
    -- Check if role change is redundant
    IF target_current_role = new_role THEN
        RETURN QUERY SELECT 
            false, 
            target_current_role, 
            new_role, 
            NULL::TIMESTAMP,
            format('User already has role: %s', new_role);
        RETURN;
    END IF;
    
    -- Update role
    UPDATE workspace_users
    SET role = new_role,
        permissions = CASE 
            WHEN new_role = 'owner' THEN jsonb_build_object('promoted_to_owner', true, 'promoted_by', requesting_user_uuid)
            WHEN new_role = 'admin' THEN jsonb_build_object('promoted_to_admin', true, 'promoted_by', requesting_user_uuid)
            ELSE jsonb_build_object('role_changed', true, 'changed_by', requesting_user_uuid)
        END,
        last_active_at = CURRENT_TIMESTAMP
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
        outcome,
        severity
    ) VALUES (
        requesting_user_uuid,
        workspace_uuid,
        'change_team_member_role',
        'workspace_membership',
        target_user_uuid,
        'team_management',
        jsonb_build_object(
            'target_user_id', target_user_uuid,
            'previous_role', target_current_role,
            'new_role', new_role,
            'role_change_reason', role_change_reason,
            'requester_role', requester_role,
            'permission_details', permission_check.permission_details
        ),
        'success',
        CASE WHEN new_role = 'owner' OR target_current_role = 'owner' THEN 'warn' ELSE 'info' END
    );
    
    RETURN QUERY SELECT 
        true,
        target_current_role,
        new_role,
        CURRENT_TIMESTAMP,
        format('Successfully changed role from %s to %s', target_current_role, new_role);
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- WORKSPACE ACCESS CONTROL DASHBOARD
-- =======================================================

-- View for workspace access control dashboard
CREATE OR REPLACE VIEW workspace_access_control_dashboard AS
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    w.slug,
    
    -- Workspace subscription info
    ws.status as subscription_status,
    sp.name as workspace_plan_name,
    sp.plan_category,
    
    -- Team composition
    (SELECT COUNT(*) FROM workspace_users wu WHERE wu.workspace_id = w.id) as total_members,
    (SELECT COUNT(*) FROM workspace_users wu WHERE wu.workspace_id = w.id AND wu.role = 'owner') as owner_count,
    (SELECT COUNT(*) FROM workspace_users wu WHERE wu.workspace_id = w.id AND wu.role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM workspace_users wu WHERE wu.workspace_id = w.id AND wu.role = 'member') as member_count,
    
    -- Plan assignment summary
    (SELECT COUNT(*) FROM user_subscriptions us 
     WHERE us.assigned_by_workspace_id = w.id AND us.status = 'active') as assigned_user_plans,
    
    -- Recent activity
    (SELECT COUNT(*) FROM audit_logs al 
     WHERE al.workspace_id = w.id 
       AND al.category = 'team_management' 
       AND al.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as recent_team_changes,
    
    -- Pending invitations
    (SELECT COUNT(*) FROM workspace_invitations wi 
     WHERE wi.workspace_id = w.id 
       AND wi.accepted_at IS NULL 
       AND wi.expires_at > CURRENT_TIMESTAMP) as pending_invitations,
    
    w.created_at,
    w.updated_at
    
FROM workspaces w
LEFT JOIN workspace_subscriptions ws ON w.id = ws.workspace_id AND ws.status = 'active'
LEFT JOIN subscription_plans sp ON ws.plan_id = sp.id
WHERE w.is_active = true
ORDER BY w.name;

-- View for team member management with permissions
CREATE OR REPLACE VIEW team_member_permissions_view AS
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    u.id as user_id,
    u.username,
    u.email,
    wu.role,
    wu.joined_at,
    wu.last_active_at,
    
    -- Effective plan information
    ep.effective_plan_name,
    ep.plan_source,
    
    -- Permission matrix
    CASE 
        WHEN wu.role = 'owner' THEN jsonb_build_object(
            'can_manage_team', true,
            'can_assign_plans', true,
            'can_invite_members', true,
            'can_remove_members', true,
            'can_modify_workspace', true,
            'can_change_roles', true,
            'can_access_billing', true
        )
        WHEN wu.role = 'admin' THEN jsonb_build_object(
            'can_manage_team', true,
            'can_assign_plans', true,
            'can_invite_members', true,
            'can_remove_members', true,
            'can_modify_workspace', false,
            'can_change_roles', true, -- limited to non-owners
            'can_access_billing', false
        )
        ELSE jsonb_build_object(
            'can_manage_team', false,
            'can_assign_plans', false,
            'can_invite_members', false,
            'can_remove_members', false,
            'can_modify_workspace', false,
            'can_change_roles', false,
            'can_access_billing', false
        )
    END as permissions,
    
    -- Plan override information
    wu.plan_overridden_by_owner,
    wu.plan_override_reason,
    
    -- User subscription info
    us.subscription_type,
    us.assigned_by_user_id,
    us.assignment_reason
    
FROM workspaces w
JOIN workspace_users wu ON w.id = wu.workspace_id
JOIN users u ON wu.user_id = u.id
LEFT JOIN LATERAL resolve_user_effective_plan(u.id, w.id) ep ON true
LEFT JOIN user_subscriptions us ON (
    u.id = us.user_id 
    AND us.status = 'active'
    AND (us.assigned_by_workspace_id = w.id OR us.subscription_type = 'personal')
)
WHERE u.is_active = true
ORDER BY w.name, 
    CASE wu.role 
        WHEN 'owner' THEN 1 
        WHEN 'admin' THEN 2 
        WHEN 'member' THEN 3 
    END,
    u.username;

RAISE NOTICE 'Workspace owner access control system installed successfully!';
RAISE NOTICE 'Key features:';
RAISE NOTICE '- validate_workspace_owner_permissions() - Comprehensive permission validation';
RAISE NOTICE '- secure_assign_team_member_plan() - Secure plan assignment with permission checks';
RAISE NOTICE '- secure_remove_team_member() - Safe team member removal with ownership transfer';
RAISE NOTICE '- secure_change_team_member_role() - Role management with hierarchy validation';
RAISE NOTICE '- workspace_access_control_dashboard view - Access control overview';
RAISE NOTICE '- team_member_permissions_view view - Detailed permission matrix';