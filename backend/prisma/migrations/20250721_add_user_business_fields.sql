-- Add business profile fields to User model
-- Required for AudioTricks production implementation
-- Addresses requirement #9: Enhanced User Profiles

-- Add business fields to users table
ALTER TABLE users 
ADD COLUMN business_name VARCHAR(255),
ADD COLUMN mobile_number VARCHAR(20),
ADD COLUMN country VARCHAR(3) DEFAULT 'AU', -- ISO 3166-1 alpha-3 country code
ADD COLUMN currency VARCHAR(3) DEFAULT 'AUD', -- ISO 4217 currency code
ADD COLUMN business_address TEXT,
ADD COLUMN business_phone VARCHAR(20),
ADD COLUMN tax_number VARCHAR(50), -- ABN/VAT/Tax ID
ADD COLUMN company_size VARCHAR(20), -- small, medium, large, enterprise
ADD COLUMN industry VARCHAR(100);

-- Add indexes for business fields
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_currency ON users(currency);
CREATE INDEX idx_users_company_size ON users(company_size);
CREATE INDEX idx_users_industry ON users(industry);

-- Add check constraints
ALTER TABLE users 
ADD CONSTRAINT chk_country_code_valid CHECK (
    country IS NULL OR LENGTH(country) = 2 OR LENGTH(country) = 3
);

ALTER TABLE users 
ADD CONSTRAINT chk_currency_code_valid CHECK (
    currency IS NULL OR LENGTH(currency) = 3
);

ALTER TABLE users 
ADD CONSTRAINT chk_company_size_valid CHECK (
    company_size IS NULL OR company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')
);

-- Update existing users with default values where appropriate
UPDATE users 
SET 
    country = 'AU',
    currency = 'AUD'
WHERE country IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.business_name IS 'Business or company name for commercial users';
COMMENT ON COLUMN users.mobile_number IS 'Mobile/cell phone number for notifications and verification';
COMMENT ON COLUMN users.country IS 'ISO 3166-1 alpha-2 country code (AU, US, GB, etc.)';
COMMENT ON COLUMN users.currency IS 'ISO 4217 currency code (AUD, USD, EUR, etc.)';
COMMENT ON COLUMN users.business_address IS 'Complete business address for invoicing and legal purposes';
COMMENT ON COLUMN users.business_phone IS 'Business phone number (different from mobile)';
COMMENT ON COLUMN users.tax_number IS 'Business tax identification number (ABN in Australia, VAT in EU, etc.)';
COMMENT ON COLUMN users.company_size IS 'Size classification of the user company';
COMMENT ON COLUMN users.industry IS 'Industry or sector the user operates in';