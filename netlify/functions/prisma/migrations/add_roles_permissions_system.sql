-- Database-driven roles and permissions system
-- This creates a flexible role-based access control system

-- Roles table - defines available roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) UNIQUE NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Permissions table - defines available permissions
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "display_name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "resource" VARCHAR(50) NOT NULL, -- e.g., 'users', 'projects', 'settings'
    "action" VARCHAR(50) NOT NULL,   -- e.g., 'read', 'write', 'delete', 'manage'
    "is_system_permission" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Role-Permission mapping table
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT NOW(),
    UNIQUE("role_id", "permission_id")
);

-- User-Role mapping table (allows multiple roles per user)
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "assigned_by" UUID REFERENCES "users"("id"),
    "assigned_at" TIMESTAMP DEFAULT NOW(),
    "expires_at" TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,
    UNIQUE("user_id", "role_id")
);

-- Insert default system roles
INSERT INTO "roles" ("name", "display_name", "description", "is_system_role", "is_active") VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', true, true),
('admin', 'Administrator', 'Administrative access to most features', true, true),
('moderator', 'Moderator', 'Can moderate content and manage users', true, true),
('user', 'Regular User', 'Standard user with basic access', true, true),
('guest', 'Guest User', 'Limited access for trial users', true, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default system permissions
INSERT INTO "permissions" ("name", "display_name", "description", "resource", "action", "is_system_permission") VALUES
-- User management
('users.read', 'View Users', 'Can view user profiles and lists', 'users', 'read', true),
('users.write', 'Edit Users', 'Can edit user information', 'users', 'write', true),
('users.delete', 'Delete Users', 'Can delete user accounts', 'users', 'delete', true),
('users.manage', 'Manage Users', 'Full user management access', 'users', 'manage', true),
('users.impersonate', 'Impersonate Users', 'Can login as other users', 'users', 'impersonate', true),

-- Project management
('projects.read', 'View Projects', 'Can view projects', 'projects', 'read', true),
('projects.write', 'Edit Projects', 'Can create and edit projects', 'projects', 'write', true),
('projects.delete', 'Delete Projects', 'Can delete projects', 'projects', 'delete', true),
('projects.manage', 'Manage Projects', 'Full project management access', 'projects', 'manage', true),

-- Audio processing
('audio.upload', 'Upload Audio', 'Can upload audio files', 'audio', 'upload', true),
('audio.process', 'Process Audio', 'Can process audio files', 'audio', 'process', true),
('audio.download', 'Download Audio', 'Can download processed audio', 'audio', 'download', true),
('audio.transcribe', 'Transcribe Audio', 'Can use transcription services', 'audio', 'transcribe', true),

-- Workspace management
('workspaces.read', 'View Workspaces', 'Can view workspace information', 'workspaces', 'read', true),
('workspaces.write', 'Edit Workspaces', 'Can edit workspace settings', 'workspaces', 'write', true),
('workspaces.delete', 'Delete Workspaces', 'Can delete workspaces', 'workspaces', 'delete', true),
('workspaces.manage', 'Manage Workspaces', 'Full workspace management', 'workspaces', 'manage', true),

-- Subscription management
('subscriptions.read', 'View Subscriptions', 'Can view subscription information', 'subscriptions', 'read', true),
('subscriptions.write', 'Edit Subscriptions', 'Can modify subscriptions', 'subscriptions', 'write', true),
('subscriptions.manage', 'Manage Subscriptions', 'Full subscription management', 'subscriptions', 'manage', true),

-- Payment management
('payments.read', 'View Payments', 'Can view payment information', 'payments', 'read', true),
('payments.write', 'Process Payments', 'Can process payments', 'payments', 'write', true),
('payments.manage', 'Manage Payments', 'Full payment system access', 'payments', 'manage', true),

-- System settings
('settings.read', 'View Settings', 'Can view system settings', 'settings', 'read', true),
('settings.write', 'Edit Settings', 'Can modify system settings', 'settings', 'write', true),
('settings.manage', 'Manage Settings', 'Full settings management', 'settings', 'manage', true),

-- Analytics and reporting
('analytics.read', 'View Analytics', 'Can view analytics and reports', 'analytics', 'read', true),
('analytics.export', 'Export Analytics', 'Can export analytics data', 'analytics', 'export', true),

-- Admin panel access
('admin.access', 'Admin Panel Access', 'Can access admin panel', 'admin', 'access', true),
('admin.dashboard', 'Admin Dashboard', 'Can view admin dashboard', 'admin', 'dashboard', true),

-- System maintenance
('system.maintenance', 'System Maintenance', 'Can perform system maintenance', 'system', 'maintenance', true),
('system.logs', 'View System Logs', 'Can view system logs', 'system', 'logs', true),
('system.health', 'System Health', 'Can view system health metrics', 'system', 'health', true)

ON CONFLICT (name) DO NOTHING;

-- Assign permissions to default roles
WITH role_permission_assignments AS (
    SELECT r.id as role_id, p.id as permission_id FROM "roles" r, "permissions" p WHERE
    -- Super Admin gets all permissions
    (r.name = 'super_admin') OR
    
    -- Admin gets most permissions except super admin only ones
    (r.name = 'admin' AND p.name IN (
        'users.read', 'users.write', 'users.delete', 'users.manage',
        'projects.read', 'projects.write', 'projects.delete', 'projects.manage',
        'audio.upload', 'audio.process', 'audio.download', 'audio.transcribe',
        'workspaces.read', 'workspaces.write', 'workspaces.manage',
        'subscriptions.read', 'subscriptions.write', 'subscriptions.manage',
        'payments.read', 'payments.write', 'payments.manage',
        'settings.read', 'settings.write',
        'analytics.read', 'analytics.export',
        'admin.access', 'admin.dashboard'
    )) OR
    
    -- Moderator gets user and content management
    (r.name = 'moderator' AND p.name IN (
        'users.read', 'users.write',
        'projects.read', 'projects.write', 'projects.delete',
        'audio.upload', 'audio.process', 'audio.download', 'audio.transcribe',
        'workspaces.read',
        'analytics.read',
        'admin.access', 'admin.dashboard'
    )) OR
    
    -- Regular user gets basic functionality
    (r.name = 'user' AND p.name IN (
        'projects.read', 'projects.write', 'projects.delete',
        'audio.upload', 'audio.process', 'audio.download', 'audio.transcribe',
        'workspaces.read'
    )) OR
    
    -- Guest gets very limited access
    (r.name = 'guest' AND p.name IN (
        'audio.upload', 'audio.process'
    ))
)
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT role_id, permission_id FROM role_permission_assignments
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Update existing users to have roles
DO $$
DECLARE
    admin_role_id UUID;
    user_role_id UUID;
    admin_user RECORD;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin';
    SELECT id INTO user_role_id FROM "roles" WHERE name = 'user';
    
    -- Assign admin role to users with role 'admin'
    FOR admin_user IN SELECT id FROM "users" WHERE role = 'admin' LOOP
        INSERT INTO "user_roles" ("user_id", "role_id") 
        VALUES (admin_user.id, admin_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END LOOP;
    
    -- Assign user role to users with role 'user' or null
    FOR admin_user IN SELECT id FROM "users" WHERE role = 'user' OR role IS NULL LOOP
        INSERT INTO "user_roles" ("user_id", "role_id") 
        VALUES (admin_user.id, user_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "user_roles"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "user_roles"("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");
CREATE INDEX IF NOT EXISTS "idx_permissions_resource_action" ON "permissions"("resource", "action");