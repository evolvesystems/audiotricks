-- Add missing columns to users table to match Prisma schema
-- Migration: Add missing user profile columns

-- Add profile columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC';

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_is_active_idx" ON "users"("is_active");