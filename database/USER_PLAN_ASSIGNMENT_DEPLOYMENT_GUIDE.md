# AudioTricks User Plan Assignment System - Deployment Guide

## 🎯 Database: `AudioTricks` (PostgreSQL)

This guide provides step-by-step instructions for deploying the user-specific plan assignment and workspace team member access control system to your AudioTricks PostgreSQL database.

---

## 📋 **Deployment Overview**

### **What We've Built:**
1. **User-Specific Plan Assignment** - Individual users can have personal plans separate from workspace plans
2. **Plan Inheritance & Resolution** - Smart resolution when users have both personal and workspace-assigned plans  
3. **Workspace Owner Team Management** - Owners/admins can assign specific plans to team members
4. **Secure Access Control** - Comprehensive permission validation for all team management actions
5. **Team Member Role Management** - Secure role changes with hierarchy validation

### **Key New Capabilities:**
- **Personal User Subscriptions** - Users can purchase individual plans
- **Workspace-Assigned Plans** - Workspace owners can assign plans to specific team members
- **Plan Hierarchy Resolution** - Automatic resolution of plan conflicts (user vs workspace)
- **Team Invitation with Plans** - Invite new members with pre-assigned plan levels
- **Secure Team Management** - Permission-validated team member management

---

## 🚀 **Step-by-Step Deployment**

### **Step 1: Deploy User Plan Assignment System**
```sql
-- 1. User-specific plan assignment and resolution system
\i user-plan-assignment-system.sql
```
**Expected Output:**
```
NOTICE:  User-specific plan assignment system installed successfully!
NOTICE:  Key features:
NOTICE:  - user_subscriptions table - Individual user plan assignments
NOTICE:  - resolve_user_effective_plan() - Smart plan resolution with inheritance
NOTICE:  - assign_user_plan_by_workspace_owner() - Workspace owners can assign plans to team members
NOTICE:  - assign_personal_plan() - Users can self-assign personal plans
NOTICE:  - get_workspace_team_members() - Team member management with plan visibility
NOTICE:  - invite_team_member_with_plan() - Invite with pre-assigned plan
NOTICE:  - check_user_transcription_quota() - User-specific quota enforcement
NOTICE:  - user_plan_dashboard view - User plan management dashboard
NOTICE:  - workspace_team_plan_overview view - Team plan overview
```

### **Step 2: Deploy Workspace Owner Access Control**
```sql
-- 2. Comprehensive access control for workspace owners
\i workspace-owner-access-control.sql
```
**Expected Output:**
```
NOTICE:  Workspace owner access control system installed successfully!
NOTICE:  Key features:
NOTICE:  - validate_workspace_owner_permissions() - Comprehensive permission validation
NOTICE:  - secure_assign_team_member_plan() - Secure plan assignment with permission checks
NOTICE:  - secure_remove_team_member() - Safe team member removal with ownership transfer
NOTICE:  - secure_change_team_member_role() - Role management with hierarchy validation
NOTICE:  - workspace_access_control_dashboard view - Access control overview
NOTICE:  - team_member_permissions_view view - Detailed permission matrix
```

---

## ✅ **Verification and Testing**

### **1. Verify New Tables Were Created**
```sql
-- Check if user plan assignment tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'user_subscriptions', 
        'plan_hierarchy_rules'
    );
```
**Expected Result:** Both tables should be listed.

### **2. Check Plan Hierarchy Rules**
```sql
-- Verify default plan hierarchy rules
SELECT rule_name, resolution_strategy, priority_order, is_active 
FROM plan_hierarchy_rules 
ORDER BY priority_order;
```
**Expected Result:**
```
       rule_name        | resolution_strategy | priority_order | is_active 
-----------------------+--------------------+---------------+-----------
 user_plan_priority    | user_overrides     |             1 | t
 workspace_owner_authority | workspace_overrides |         2 | t
 highest_limits_default | highest_plan       |            10 | t
```

### **3. Test User Plan Assignment**
```sql
-- Test assigning a personal plan to a user
SELECT assign_personal_plan(
    (SELECT id FROM users LIMIT 1),  -- user_id
    (SELECT id FROM subscription_plans WHERE plan_code = 'starter_monthly' LIMIT 1)  -- plan_id
);
```

### **4. Test Plan Resolution**
```sql
-- Test plan resolution for a user in a workspace
SELECT * FROM resolve_user_effective_plan(
    (SELECT id FROM users LIMIT 1),      -- user_id
    (SELECT id FROM workspaces LIMIT 1)  -- workspace_id
);
```

### **5. Test Workspace Owner Permissions**
```sql
-- Test permission validation
SELECT * FROM validate_workspace_owner_permissions(
    (SELECT wu.user_id FROM workspace_users wu WHERE wu.role = 'owner' LIMIT 1),  -- owner_id
    (SELECT wu.workspace_id FROM workspace_users wu WHERE wu.role = 'owner' LIMIT 1),  -- workspace_id
    (SELECT wu.user_id FROM workspace_users wu WHERE wu.role = 'member' LIMIT 1),  -- target_user_id
    'assign_plans'  -- action
);
```

---

## 📊 **Usage Examples**

### **1. Workspace Owner Assigns Plan to Team Member**
```sql
SELECT * FROM secure_assign_team_member_plan(
    '12345678-1234-5678-9012-123456789012'::UUID, -- workspace_owner_id
    '87654321-4321-8765-2109-876543210987'::UUID, -- team_member_id
    'abcdef12-3456-7890-abcd-ef1234567890'::UUID, -- workspace_id
    (SELECT id FROM subscription_plans WHERE plan_code = 'creator_monthly'), -- plan_id
    'Team member needs higher transcription limits for project'  -- reason
);
```

### **2. User Self-Assigns Personal Plan**
```sql
SELECT assign_personal_plan(
    '87654321-4321-8765-2109-876543210987'::UUID, -- user_id
    (SELECT id FROM subscription_plans WHERE plan_code = 'professional_monthly'), -- plan_id
    'sub_1234567890abcdef'  -- stripe_subscription_id
);
```

### **3. Get Team Members with Plan Information**
```sql
SELECT * FROM get_workspace_team_members(
    'abcdef12-3456-7890-abcd-ef1234567890'::UUID, -- workspace_id
    '12345678-1234-5678-9012-123456789012'::UUID  -- requesting_user_id (owner/admin)
);
```

### **4. Change Team Member Role**
```sql
SELECT * FROM secure_change_team_member_role(
    '12345678-1234-5678-9012-123456789012'::UUID, -- workspace_owner_id
    '87654321-4321-8765-2109-876543210987'::UUID, -- team_member_id
    'abcdef12-3456-7890-abcd-ef1234567890'::UUID, -- workspace_id
    'admin',  -- new_role
    'Promoting user to admin for project management responsibilities'  -- reason
);
```

### **5. Invite Team Member with Pre-Assigned Plan**
```sql
SELECT invite_team_member_with_plan(
    'abcdef12-3456-7890-abcd-ef1234567890'::UUID, -- workspace_id
    '12345678-1234-5678-9012-123456789012'::UUID, -- inviter_id
    'newteammember@example.com',  -- email
    'member',  -- role
    (SELECT id FROM subscription_plans WHERE plan_code = 'starter_monthly'), -- plan_id
    'Welcome to our workspace! You have been assigned a Starter plan.'  -- message
);
```

### **6. Remove Team Member Safely**
```sql
SELECT * FROM secure_remove_team_member(
    '12345678-1234-5678-9012-123456789012'::UUID, -- requesting_user_id
    '87654321-4321-8765-2109-876543210987'::UUID, -- target_user_id
    'abcdef12-3456-7890-abcd-ef1234567890'::UUID, -- workspace_id
    'End of project collaboration',  -- reason
    false,  -- transfer_ownership
    NULL    -- new_owner_id
);
```

---

## 🔍 **Monitoring and Analytics**

### **1. User Plan Dashboard**
```sql
-- View all user plan assignments
SELECT * FROM user_plan_dashboard 
WHERE subscription_type IN ('personal', 'assigned')
ORDER BY created_at DESC 
LIMIT 10;
```

### **2. Workspace Access Control Overview**
```sql
-- Monitor workspace access control
SELECT * FROM workspace_access_control_dashboard
WHERE recent_team_changes > 0
ORDER BY recent_team_changes DESC;
```

### **3. Team Member Permissions Matrix**
```sql
-- View detailed permission matrix for a workspace
SELECT * FROM team_member_permissions_view
WHERE workspace_id = 'abcdef12-3456-7890-abcd-ef1234567890'::UUID
ORDER BY role, username;
```

### **4. Plan Resolution Analysis**
```sql
-- Analyze plan resolution across workspaces
SELECT 
    workspace_name,
    plan_source,
    COUNT(*) as user_count,
    ARRAY_AGG(DISTINCT effective_plan_name) as plans_in_use
FROM workspace_team_plan_overview
GROUP BY workspace_name, plan_source
ORDER BY workspace_name, user_count DESC;
```

---

## 🔧 **Configuration and Management**

### **1. Update Plan Hierarchy Rules**
```sql
-- Add custom hierarchy rule for enterprise workspaces
INSERT INTO plan_hierarchy_rules (
    rule_name,
    description,
    resolution_strategy,
    applies_to_workspace_types,
    priority_order
) VALUES (
    'enterprise_workspace_priority',
    'Enterprise workspaces can override any user plan',
    'workspace_overrides',
    ARRAY['enterprise'],
    0  -- Highest priority
);
```

### **2. Monitor Plan Assignment Activity**
```sql
-- Check recent plan assignments
SELECT 
    al.created_at,
    al.action,
    u1.username as performed_by,
    u2.username as target_user,
    w.name as workspace_name,
    al.details->>'new_plan'->>'plan_name' as assigned_plan
FROM audit_logs al
JOIN users u1 ON al.user_id = u1.id
LEFT JOIN users u2 ON (al.details->>'target_user_id')::UUID = u2.id
LEFT JOIN workspaces w ON al.workspace_id = w.id
WHERE al.category = 'team_management'
    AND al.action IN ('secure_plan_assignment', 'assign_personal_plan')
    AND al.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY al.created_at DESC;
```

### **3. Audit Workspace Owner Actions**
```sql
-- Monitor workspace owner actions
SELECT 
    w.name as workspace_name,
    u.username as owner_username,
    COUNT(*) as actions_last_30_days,
    ARRAY_AGG(DISTINCT al.action) as actions_performed
FROM audit_logs al
JOIN workspaces w ON al.workspace_id = w.id
JOIN users u ON al.user_id = u.id
JOIN workspace_users wu ON (u.id = wu.user_id AND w.id = wu.workspace_id AND wu.role = 'owner')
WHERE al.category = 'team_management'
    AND al.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY w.name, u.username
ORDER BY actions_last_30_days DESC;
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"User already has this plan assigned" error:**
   ```sql
   -- Force override an existing plan assignment
   SELECT * FROM secure_assign_team_member_plan(
       owner_id, user_id, workspace_id, new_plan_id, 
       'Force override existing assignment',
       true  -- force_override = true
   );
   ```

2. **Permission denied errors:**
   ```sql
   -- Check user's role and permissions
   SELECT * FROM validate_workspace_owner_permissions(
       user_id, workspace_id, target_user_id, 'assign_plans'
   );
   ```

3. **Plan resolution conflicts:**
   ```sql
   -- Debug plan resolution
   SELECT * FROM resolve_user_effective_plan(user_id, workspace_id);
   
   -- Check all user subscriptions
   SELECT * FROM user_subscriptions 
   WHERE user_id = 'user_uuid' 
   ORDER BY created_at DESC;
   ```

4. **Orphaned plan assignments:**
   ```sql
   -- Clean up cancelled subscriptions
   UPDATE user_subscriptions 
   SET status = 'expired'
   WHERE status = 'cancelled' 
       AND cancelled_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
   ```

### **Performance Optimization:**
```sql
-- Add additional indexes if needed
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_assignment_context 
    ON user_subscriptions(assigned_by_workspace_id, assigned_by_user_id, status);

CREATE INDEX IF NOT EXISTS idx_workspace_users_effective_plan 
    ON workspace_users(effective_plan_id, plan_inherited_from);

-- Analyze table statistics
ANALYZE user_subscriptions, plan_hierarchy_rules, workspace_users;
```

---

## 🎉 **Deployment Complete!**

Your `AudioTricks` PostgreSQL database now has a comprehensive user plan assignment and workspace team management system with:

✅ **Individual User Plans** - Users can have personal subscriptions separate from workspace plans  
✅ **Smart Plan Resolution** - Automatic resolution of user vs workspace plan conflicts  
✅ **Workspace Team Management** - Owners/admins can assign specific plans to team members  
✅ **Secure Access Control** - Permission validation for all team management actions  
✅ **Role-Based Permissions** - Comprehensive role hierarchy with proper validation  
✅ **Team Invitation System** - Invite members with pre-assigned plan levels  
✅ **Audit Trail** - Complete logging of all team and plan management actions  

The system seamlessly integrates with your existing subscription infrastructure while adding granular user-level control that workspace owners need for effective team management!

## 🔗 **Integration with Existing System**

This user plan assignment system integrates with:
- **Enhanced Subscription Plans** (from previous deployment)
- **Plan Enforcement Functions** (quota checking updated for user-specific plans)
- **Plan Recommendation Engine** (considers both user and workspace plans)
- **Custom Enterprise Plans** (workspace owners can assign custom plans to team members)
- **Existing Audit Logging** (comprehensive audit trail for all actions)

All existing functionality continues to work while gaining the new user-specific plan capabilities!