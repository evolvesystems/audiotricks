-- Add additional user fields for business information
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "business_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "mobile" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "country" VARCHAR(2) DEFAULT 'US',
ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) DEFAULT 'USD';

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS "idx_users_country" ON "users"("country");
CREATE INDEX IF NOT EXISTS "idx_users_currency" ON "users"("currency");