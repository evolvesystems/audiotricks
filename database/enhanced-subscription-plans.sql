-- AudioTricks Enhanced Subscription Plans System
-- This file extends the subscription system with granular limits and advanced plan management

-- =======================================================
-- ENHANCED SUBSCRIPTION PLANS SCHEMA
-- =======================================================

-- Add granular limit columns to existing subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN max_transcriptions_monthly BIGINT DEFAULT 0,
ADD COLUMN max_files_daily INTEGER DEFAULT 0,
ADD COLUMN max_files_monthly INTEGER DEFAULT 0,
ADD COLUMN max_concurrent_jobs INTEGER DEFAULT 1,
ADD COLUMN max_voice_synthesis_monthly BIGINT DEFAULT 0,
ADD COLUMN max_export_operations_monthly INTEGER DEFAULT 0,
ADD COLUMN max_audio_duration_minutes INTEGER DEFAULT 0, -- 0 = unlimited
ADD COLUMN priority_level INTEGER DEFAULT 5 CHECK (priority_level >= 1 AND priority_level <= 10),
ADD COLUMN plan_category VARCHAR(50) DEFAULT 'personal',
ADD COLUMN trial_days INTEGER DEFAULT 0,
ADD COLUMN is_custom BOOLEAN DEFAULT false,
ADD COLUMN is_enterprise BOOLEAN DEFAULT false,
ADD COLUMN recommended_for TEXT[],
ADD COLUMN allowed_file_types TEXT[],
ADD COLUMN analysis_features TEXT[],
ADD COLUMN collaboration_features TEXT[],
ADD COLUMN integration_features TEXT[];

-- Add check constraints for new columns
ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_plan_limits_positive CHECK (
    max_transcriptions_monthly >= 0 AND
    max_files_daily >= 0 AND
    max_files_monthly >= 0 AND
    max_concurrent_jobs >= 1 AND
    max_voice_synthesis_monthly >= 0 AND
    max_export_operations_monthly >= 0 AND
    max_audio_duration_minutes >= 0
);

ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_plan_category_valid CHECK (
    plan_category IN ('personal', 'business', 'enterprise', 'custom')
);

-- =======================================================
-- PLAN CATEGORIES LOOKUP TABLE
-- =======================================================

CREATE TABLE plan_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    target_audience TEXT,
    key_benefits TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert plan categories
INSERT INTO plan_categories (name, display_name, description, sort_order, icon, color, target_audience, key_benefits) VALUES
('personal', 'Personal', 'Perfect for individuals and personal projects', 1, 'user', '#3B82F6', 'Individual creators, students, hobbyists', ARRAY['Easy to use', 'Basic features', 'Affordable pricing']),
('business', 'Business', 'Designed for teams and growing businesses', 2, 'building', '#10B981', 'Small to medium businesses, teams, agencies', ARRAY['Team collaboration', 'Advanced features', 'Priority support']),
('enterprise', 'Enterprise', 'Comprehensive solutions for large organizations', 3, 'office-building', '#8B5CF6', 'Large enterprises, corporations, institutions', ARRAY['Custom solutions', 'Advanced security', 'Dedicated support']),
('custom', 'Custom', 'Tailored plans for specific requirements', 4, 'cog', '#F59E0B', 'Organizations with unique needs', ARRAY['Flexible limits', 'Custom features', 'Negotiated pricing']);

-- =======================================================
-- USAGE COUNTERS TABLE
-- =======================================================

CREATE TABLE usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Period tracking
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Usage counters
    transcriptions_used INTEGER DEFAULT 0,
    files_uploaded INTEGER DEFAULT 0,
    voice_synthesis_used INTEGER DEFAULT 0,
    export_operations_used INTEGER DEFAULT 0,
    
    -- Processing metrics
    total_processing_minutes DECIMAL(10,2) DEFAULT 0,
    concurrent_jobs_peak INTEGER DEFAULT 0,
    
    -- Feature usage tracking
    feature_usage JSONB DEFAULT '{}', -- Track specific feature usage
    
    -- Reset tracking
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_reset BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, workspace_id, period_type, period_start)
);

-- Indexes for usage counters
CREATE INDEX idx_usage_counters_user_period ON usage_counters(user_id, period_type, period_start);
CREATE INDEX idx_usage_counters_workspace_period ON usage_counters(workspace_id, period_type, period_start);
CREATE INDEX idx_usage_counters_reset ON usage_counters(last_reset_at) WHERE auto_reset = true;

-- =======================================================
-- PLAN RECOMMENDATIONS TABLE
-- =======================================================

CREATE TABLE plan_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Current state
    current_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    recommended_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Recommendation context
    recommendation_reason VARCHAR(100) NOT NULL, -- quota_exceeded, feature_needed, cost_optimization
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Usage analysis
    usage_pattern JSONB, -- Detailed usage analysis
    projected_savings DECIMAL(10,2), -- Monthly savings/cost
    roi_months INTEGER, -- Months to break even
    
    -- Recommendation details
    triggered_by VARCHAR(50), -- specific limit or feature that triggered
    benefits TEXT[], -- List of benefits from upgrade
    limitations_removed TEXT[], -- Current limitations that would be removed
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, viewed, dismissed, accepted
    viewed_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    accepted_at TIMESTAMP,
    
    -- Expiry
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for plan recommendations
CREATE INDEX idx_plan_recommendations_user_status ON plan_recommendations(user_id, status, created_at DESC);
CREATE INDEX idx_plan_recommendations_workspace_status ON plan_recommendations(workspace_id, status, created_at DESC);
CREATE INDEX idx_plan_recommendations_expires ON plan_recommendations(expires_at) WHERE expires_at IS NOT NULL;

-- =======================================================
-- CUSTOM PLANS TABLE
-- =======================================================

CREATE TABLE custom_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    base_plan_id UUID REFERENCES subscription_plans(id),
    
    -- Plan details
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Custom limits (NULL = use base plan limit)
    custom_max_transcriptions_monthly BIGINT,
    custom_max_files_daily INTEGER,
    custom_max_files_monthly INTEGER,
    custom_max_concurrent_jobs INTEGER,
    custom_max_voice_synthesis_monthly BIGINT,
    custom_max_export_operations_monthly INTEGER,
    custom_max_audio_duration_minutes INTEGER,
    custom_priority_level INTEGER,
    
    -- Custom features
    custom_features TEXT[],
    excluded_features TEXT[],
    additional_features TEXT[],
    
    -- Pricing
    custom_price DECIMAL(10,2),
    pricing_model VARCHAR(50) DEFAULT 'fixed', -- fixed, usage_based, hybrid
    billing_interval VARCHAR(20) DEFAULT 'monthly',
    
    -- Contract details
    contract_start_date DATE,
    contract_end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    notice_period_days INTEGER DEFAULT 30,
    
    -- Approval workflow
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approval_notes TEXT,
    
    -- Activation
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- FEATURE FLAGS TABLE
-- =======================================================

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    
    -- Feature classification
    category VARCHAR(50), -- core, premium, experimental, enterprise
    feature_type VARCHAR(50), -- ui_component, api_endpoint, processing_option, integration
    
    -- Availability
    min_plan_level INTEGER DEFAULT 1, -- Minimum plan level required
    required_plans TEXT[], -- Specific plans that include this feature
    excluded_plans TEXT[], -- Plans that explicitly exclude this feature
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    is_beta BOOLEAN DEFAULT false,
    is_deprecated BOOLEAN DEFAULT false,
    
    -- Usage tracking
    usage_count BIGINT DEFAULT 0,
    last_used_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert core feature flags
INSERT INTO feature_flags (feature_name, display_name, description, category, feature_type, min_plan_level, required_plans) VALUES
('basic_transcription', 'Basic Transcription', 'Standard audio transcription using Whisper-1', 'core', 'processing_option', 1, ARRAY['free', 'starter', 'professional', 'team', 'enterprise']),
('advanced_transcription', 'Advanced Transcription', 'High-accuracy transcription with speaker identification', 'premium', 'processing_option', 2, ARRAY['professional', 'team', 'enterprise']),
('voice_synthesis', 'Voice Synthesis', 'Convert text to speech using AI voices', 'premium', 'processing_option', 2, ARRAY['starter', 'professional', 'team', 'enterprise']),
('real_time_transcription', 'Real-time Transcription', 'Live audio transcription during recording', 'premium', 'processing_option', 3, ARRAY['professional', 'team', 'enterprise']),
('custom_vocabulary', 'Custom Vocabulary', 'Add custom words and phrases for better accuracy', 'premium', 'processing_option', 3, ARRAY['professional', 'team', 'enterprise']),
('api_access', 'API Access', 'Programmatic access to AudioTricks features', 'premium', 'api_endpoint', 3, ARRAY['professional', 'team', 'enterprise']),
('webhook_integrations', 'Webhook Integrations', 'Real-time notifications and integrations', 'premium', 'integration', 4, ARRAY['team', 'enterprise']),
('white_label_branding', 'White Label Branding', 'Custom branding and domain', 'enterprise', 'ui_component', 5, ARRAY['enterprise']),
('sso_integration', 'SSO Integration', 'Single Sign-On with enterprise identity providers', 'enterprise', 'integration', 5, ARRAY['enterprise']),
('priority_processing', 'Priority Processing', 'Faster processing queue for premium users', 'premium', 'processing_option', 3, ARRAY['professional', 'team', 'enterprise']),
('bulk_operations', 'Bulk Operations', 'Process multiple files simultaneously', 'premium', 'processing_option', 2, ARRAY['starter', 'professional', 'team', 'enterprise']),
('advanced_analytics', 'Advanced Analytics', 'Detailed usage and performance analytics', 'premium', 'ui_component', 3, ARRAY['professional', 'team', 'enterprise']),
('team_collaboration', 'Team Collaboration', 'Share workspaces and collaborate on projects', 'premium', 'ui_component', 2, ARRAY['starter', 'professional', 'team', 'enterprise']),
('export_formats', 'Advanced Export Formats', 'Export to PDF, DOCX, and other formats', 'premium', 'processing_option', 2, ARRAY['starter', 'professional', 'team', 'enterprise']);

-- =======================================================
-- PLAN FEATURE MATRIX TABLE
-- =======================================================

CREATE TABLE plan_feature_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    -- Feature configuration for this plan
    is_enabled BOOLEAN DEFAULT true,
    usage_limit INTEGER, -- Specific limit for this feature on this plan
    
    -- Billing
    included_usage INTEGER DEFAULT 0, -- Included in base plan
    overage_rate DECIMAL(10,6), -- Cost per unit over included usage
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(plan_id, feature_flag_id)
);

-- =======================================================
-- ENHANCED PLAN DEFINITIONS
-- =======================================================

-- Update existing plans with granular limits
-- Note: This assumes the plans already exist from seed-data.sql

-- Update Free plan
UPDATE subscription_plans 
SET 
    max_transcriptions_monthly = 25,
    max_files_daily = 3,
    max_files_monthly = 50,
    max_concurrent_jobs = 1,
    max_voice_synthesis_monthly = 0, -- Not included in free
    max_export_operations_monthly = 5,
    max_audio_duration_minutes = 30, -- 30 minute max per file
    priority_level = 3,
    plan_category = 'personal',
    trial_days = 0,
    recommended_for = ARRAY['Students', 'Hobbyists', 'Personal projects'],
    allowed_file_types = ARRAY['mp3', 'wav', 'm4a'],
    analysis_features = ARRAY['basic_transcription'],
    collaboration_features = ARRAY[],
    integration_features = ARRAY[]
WHERE plan_code = 'free';

-- Update Starter plan
UPDATE subscription_plans 
SET 
    max_transcriptions_monthly = 200,
    max_files_daily = 10,
    max_files_monthly = 300,
    max_concurrent_jobs = 2,
    max_voice_synthesis_monthly = 50,
    max_export_operations_monthly = 20,
    max_audio_duration_minutes = 120, -- 2 hour max per file
    priority_level = 5,
    plan_category = 'personal',
    trial_days = 14,
    recommended_for = ARRAY['Individual creators', 'Freelancers', 'Small projects'],
    allowed_file_types = ARRAY['mp3', 'wav', 'm4a', 'flac', 'ogg'],
    analysis_features = ARRAY['basic_transcription', 'voice_synthesis', 'basic_analysis'],
    collaboration_features = ARRAY['workspace_sharing'],
    integration_features = ARRAY[]
WHERE plan_code = 'starter_monthly';

-- Update Professional plan
UPDATE subscription_plans 
SET 
    max_transcriptions_monthly = 1000,
    max_files_daily = 50,
    max_files_monthly = 1500,
    max_concurrent_jobs = 5,
    max_voice_synthesis_monthly = 300,
    max_export_operations_monthly = 100,
    max_audio_duration_minutes = 480, -- 8 hour max per file
    priority_level = 7,
    plan_category = 'business',
    trial_days = 30,
    recommended_for = ARRAY['Growing businesses', 'Content teams', 'Marketing agencies'],
    allowed_file_types = ARRAY['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus', 'aac'],
    analysis_features = ARRAY['advanced_transcription', 'voice_synthesis', 'speaker_identification', 'sentiment_analysis'],
    collaboration_features = ARRAY['team_workspaces', 'user_management', 'role_permissions'],
    integration_features = ARRAY['api_access', 'zapier_integration']
WHERE plan_code = 'pro_monthly';

-- Update Team plan
UPDATE subscription_plans 
SET 
    max_transcriptions_monthly = 5000,
    max_files_daily = 200,
    max_files_monthly = 6000,
    max_concurrent_jobs = 10,
    max_voice_synthesis_monthly = 1000,
    max_export_operations_monthly = 500,
    max_audio_duration_minutes = 0, -- Unlimited duration
    priority_level = 8,
    plan_category = 'business',
    trial_days = 30,
    recommended_for = ARRAY['Large teams', 'Departments', 'Media companies'],
    allowed_file_types = ARRAY['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus', 'aac', 'wma'],
    analysis_features = ARRAY['advanced_transcription', 'voice_synthesis', 'real_time_transcription', 'custom_vocabulary', 'advanced_analytics'],
    collaboration_features = ARRAY['advanced_team_features', 'project_management', 'approval_workflows'],
    integration_features = ARRAY['full_api_access', 'webhook_integrations', 'sso_basic']
WHERE plan_code = 'team_monthly';

-- Update Enterprise plan
UPDATE subscription_plans 
SET 
    max_transcriptions_monthly = -1, -- Unlimited
    max_files_daily = -1, -- Unlimited
    max_files_monthly = -1, -- Unlimited
    max_concurrent_jobs = 50,
    max_voice_synthesis_monthly = -1, -- Unlimited
    max_export_operations_monthly = -1, -- Unlimited
    max_audio_duration_minutes = 0, -- Unlimited duration
    priority_level = 10,
    plan_category = 'enterprise',
    trial_days = 60,
    recommended_for = ARRAY['Large enterprises', 'Government', 'Educational institutions'],
    allowed_file_types = ARRAY['all_supported_formats'],
    analysis_features = ARRAY['all_features', 'custom_models', 'ai_insights'],
    collaboration_features = ARRAY['enterprise_collaboration', 'advanced_security', 'compliance_features'],
    integration_features = ARRAY['enterprise_api', 'custom_integrations', 'sso_enterprise', 'white_label']
WHERE plan_code = 'enterprise_monthly';

-- =======================================================
-- NEW PLAN DEFINITIONS
-- =======================================================

-- Hobbyist Plan (between Free and Starter)
INSERT INTO subscription_plans (
    id, name, description, plan_code, price, currency, billing_interval,
    max_api_calls, max_tokens, max_storage_mb, max_processing_min,
    max_workspaces, max_users, max_file_size,
    max_transcriptions_monthly, max_files_daily, max_files_monthly,
    max_concurrent_jobs, max_voice_synthesis_monthly, max_export_operations_monthly,
    max_audio_duration_minutes, priority_level, plan_category, trial_days,
    features, recommended_for, allowed_file_types, analysis_features,
    collaboration_features, integration_features,
    is_active, is_public, sort_order
) VALUES (
    gen_random_uuid(),
    'Hobbyist',
    'Perfect for enthusiasts and regular personal use',
    'hobbyist_monthly',
    4.99,
    'USD',
    'monthly',
    500,        -- 500 API calls per month
    25000,      -- 25K tokens per month
    500,        -- 500MB storage
    60,         -- 1 hour processing per month
    1,          -- 1 workspace
    5,          -- 5 users
    52428800,   -- 50MB max file size
    100,        -- 100 transcriptions per month
    5,          -- 5 files per day
    150,        -- 150 files per month
    2,          -- 2 concurrent jobs
    25,         -- 25 voice synthesis per month
    10,         -- 10 exports per month
    60,         -- 1 hour max per file
    4,          -- Priority level 4
    'personal',
    7,          -- 7 day trial
    ARRAY['basic_transcription', 'voice_synthesis', 'export_formats', 'email_support'],
    ARRAY['Regular users', 'Podcast listeners', 'Language learners'],
    ARRAY['mp3', 'wav', 'm4a', 'flac'],
    ARRAY['basic_transcription', 'voice_synthesis'],
    ARRAY['basic_sharing'],
    ARRAY[],
    true,
    true,
    1.5 -- Between free (1) and starter (2)
);

-- Creator Plan (between Starter and Professional)
INSERT INTO subscription_plans (
    id, name, description, plan_code, price, currency, billing_interval,
    max_api_calls, max_tokens, max_storage_mb, max_processing_min,
    max_workspaces, max_users, max_file_size,
    max_transcriptions_monthly, max_files_daily, max_files_monthly,
    max_concurrent_jobs, max_voice_synthesis_monthly, max_export_operations_monthly,
    max_audio_duration_minutes, priority_level, plan_category, trial_days,
    features, recommended_for, allowed_file_types, analysis_features,
    collaboration_features, integration_features,
    is_active, is_public, sort_order
) VALUES (
    gen_random_uuid(),
    'Creator',
    'Designed for content creators and small businesses',
    'creator_monthly',
    19.99,
    'USD',
    'monthly',
    5000,       -- 5K API calls per month
    250000,     -- 250K tokens per month
    5120,       -- 5GB storage
    300,        -- 5 hours processing per month
    3,          -- 3 workspaces
    10,         -- 10 users
    104857600,  -- 100MB max file size
    500,        -- 500 transcriptions per month
    25,         -- 25 files per day
    750,        -- 750 files per month
    4,          -- 4 concurrent jobs
    150,        -- 150 voice synthesis per month
    50,         -- 50 exports per month
    240,        -- 4 hour max per file
    6,          -- Priority level 6
    'business',
    21,         -- 21 day trial
    ARRAY['advanced_transcription', 'voice_synthesis', 'speaker_identification', 'priority_processing', 'api_access', 'chat_support'],
    ARRAY['Content creators', 'YouTubers', 'Podcasters', 'Small businesses'],
    ARRAY['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus'],
    ARRAY['advanced_transcription', 'voice_synthesis', 'speaker_identification', 'basic_analytics'],
    ARRAY['team_workspaces', 'basic_collaboration'],
    ARRAY['basic_api_access'],
    true,
    true,
    2.5 -- Between starter (2) and professional (3)
);

-- Studio Plan (between Team and Enterprise)
INSERT INTO subscription_plans (
    id, name, description, plan_code, price, currency, billing_interval,
    max_api_calls, max_tokens, max_storage_mb, max_processing_min,
    max_workspaces, max_users, max_file_size,
    max_transcriptions_monthly, max_files_daily, max_files_monthly,
    max_concurrent_jobs, max_voice_synthesis_monthly, max_export_operations_monthly,
    max_audio_duration_minutes, priority_level, plan_category, trial_days,
    features, recommended_for, allowed_file_types, analysis_features,
    collaboration_features, integration_features,
    is_active, is_public, sort_order
) VALUES (
    gen_random_uuid(),
    'Studio',
    'Professional studios and production companies',
    'studio_monthly',
    99.99,
    'USD',
    'monthly',
    50000,      -- 50K API calls per month
    2500000,    -- 2.5M tokens per month
    102400,     -- 100GB storage
    3000,       -- 50 hours processing per month
    15,         -- 15 workspaces
    200,        -- 200 users
    524288000,  -- 500MB max file size
    10000,      -- 10K transcriptions per month
    500,        -- 500 files per day
    15000,      -- 15K files per month
    25,         -- 25 concurrent jobs
    2000,       -- 2K voice synthesis per month
    1000,       -- 1K exports per month
    0,          -- Unlimited duration
    9,          -- Priority level 9
    'business',
    45,         -- 45 day trial
    ARRAY['all_transcription_features', 'unlimited_voice_synthesis', 'real_time_processing', 'custom_models', 'priority_support', 'advanced_api', 'webhook_integrations'],
    ARRAY['Production studios', 'Media companies', 'Broadcasting', 'Large agencies'],
    ARRAY['all_supported_formats'],
    ARRAY['advanced_transcription', 'real_time_transcription', 'custom_vocabulary', 'ai_insights', 'advanced_analytics'],
    ARRAY['advanced_team_features', 'project_management', 'client_collaboration'],
    ARRAY['full_api_access', 'webhook_integrations', 'custom_integrations'],
    true,
    true,
    4.5 -- Between team (4) and enterprise (5)
);

RAISE NOTICE 'Enhanced subscription plans system installed successfully!';
RAISE NOTICE 'Key improvements:';
RAISE NOTICE '- Granular limits: transcriptions, files, voice synthesis, exports';
RAISE NOTICE '- Plan categories: personal, business, enterprise, custom';
RAISE NOTICE '- Usage counters: real-time tracking with period management';
RAISE NOTICE '- Plan recommendations: AI-powered upgrade suggestions';
RAISE NOTICE '- Custom plans: enterprise-specific plan creation';
RAISE NOTICE '- Feature flags: granular feature control by plan';
RAISE NOTICE '- New plans: Hobbyist, Creator, Studio for better segmentation';