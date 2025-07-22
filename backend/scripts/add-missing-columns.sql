-- Add missing columns with proper defaults for production database

-- Add updated_at column to permissions with default now()
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
UPDATE permissions SET updated_at = created_at WHERE updated_at IS NULL;

-- Add interval column to plan_pricing with default monthly
ALTER TABLE plan_pricing ADD COLUMN IF NOT EXISTS interval VARCHAR DEFAULT 'monthly';

-- Add billing_period to subscription_plans with default monthly
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_period VARCHAR DEFAULT 'monthly';

-- Add quotas to subscription_plans with default empty JSON
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS quotas JSON DEFAULT '{}';

-- Add missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_permissions_updated_at ON permissions (updated_at);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_billing_period ON subscription_plans (billing_period);