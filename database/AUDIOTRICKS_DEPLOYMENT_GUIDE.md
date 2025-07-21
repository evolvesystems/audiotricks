# AudioTricks Enhanced Subscription System - PostgreSQL Deployment Guide

## 🎯 Database: `AudioTricks` (PostgreSQL)

This guide provides step-by-step instructions for deploying the enhanced AudioTricks subscription system to your existing PostgreSQL database `AudioTricks`.

---

## 📋 **Deployment Overview**

### **What We've Built:**
1. **Enhanced Subscription Plans** - Granular limits for transcriptions, files, voice synthesis
2. **Plan Enforcement System** - Real-time quota checking and validation
3. **AI-Powered Recommendations** - Smart plan upgrade suggestions
4. **Custom Enterprise Plans** - Tailored plans for large organizations
5. **Comprehensive Usage Tracking** - Period-based counters and analytics

### **New Plan Structure:**
- **Free** ($0) → 25 transcriptions/month, 3 files/day, 50 files/month
- **Hobbyist** ($4.99) → 100 transcriptions/month, 5 files/day, 150 files/month
- **Starter** ($9.99) → 200 transcriptions/month, 10 files/day, 300 files/month  
- **Creator** ($19.99) → 500 transcriptions/month, 25 files/day, 750 files/month
- **Professional** ($29.99) → 1K transcriptions/month, 50 files/day, 1.5K files/month
- **Team** ($59.99) → 5K transcriptions/month, 200 files/day, 6K files/month
- **Studio** ($99.99) → 10K transcriptions/month, 500 files/day, 15K files/month
- **Enterprise** ($199.99) → Unlimited transcriptions, unlimited files

---

## 🚀 **Step-by-Step Deployment**

### **Step 1: Connect to Your Database**
```bash
# Connect to existing AudioTricks PostgreSQL database
psql -h your-host -U your-username -d AudioTricks

# Or if local:
psql -d AudioTricks
```

### **Step 2: Deploy Core Schema Extensions**
```sql
-- 1. Enhanced subscription plans schema
\i enhanced-subscription-plans.sql
```
**Expected Output:**
```
NOTICE:  Enhanced subscription plans system installed successfully!
NOTICE:  Key improvements:
NOTICE:  - Granular limits: transcriptions, files, voice synthesis, exports
NOTICE:  - Plan categories: personal, business, enterprise, custom
NOTICE:  - Usage counters: real-time tracking with period management
NOTICE:  - Plan recommendations: AI-powered upgrade suggestions
NOTICE:  - Custom plans: enterprise-specific plan creation
NOTICE:  - Feature flags: granular feature control by plan
NOTICE:  - New plans: Hobbyist, Creator, Studio for better segmentation
```

### **Step 3: Deploy Enforcement System**
```sql
-- 2. Plan enforcement and quota checking
\i plan-enforcement-functions.sql
```
**Expected Output:**
```
NOTICE:  Plan enforcement and quota checking system installed successfully!
NOTICE:  Key functions available:
NOTICE:  - check_transcription_quota(user_id, workspace_id)
NOTICE:  - check_file_upload_quota(user_id, workspace_id)
NOTICE:  - check_voice_synthesis_quota(user_id, workspace_id)
NOTICE:  - validate_file_upload(user_id, workspace_id, file_type, file_size, duration)
NOTICE:  - can_start_processing_job(user_id, workspace_id, job_type)
NOTICE:  - Real-time quota monitoring with quota_monitoring view
```

### **Step 4: Deploy Recommendation Engine**
```sql
-- 3. AI-powered plan recommendations
\i plan-recommendation-engine.sql
```
**Expected Output:**
```
NOTICE:  Plan recommendation engine installed successfully!
NOTICE:  Key features:
NOTICE:  - analyze_usage_patterns(user_id, workspace_id, days) - Deep usage analysis
NOTICE:  - generate_plan_recommendation(user_id, workspace_id) - AI-powered recommendations
NOTICE:  - create_plan_recommendation(user_id, workspace_id) - Store recommendations
NOTICE:  - trigger_automatic_recommendations() - Automated recommendation generation
NOTICE:  - analyze_cost_efficiency(user_id, workspace_id) - Cost optimization analysis
NOTICE:  - recommendation_dashboard view - Management dashboard
NOTICE:  - usage_efficiency_monitoring view - Efficiency tracking
```

### **Step 5: Deploy Enterprise Plans System**
```sql
-- 4. Custom enterprise plans
\i custom-enterprise-plans.sql
```
**Expected Output:**
```
NOTICE:  Custom enterprise plans system installed successfully!
NOTICE:  Key features:
NOTICE:  - create_custom_enterprise_plan() - Create tailored enterprise plans
NOTICE:  - approve_custom_plan() - Approval workflow for custom plans
NOTICE:  - get_custom_plan_limits() - Retrieve custom plan limits
NOTICE:  - get_plan_limits_enhanced() - Enhanced limits with custom plan support
NOTICE:  - Enterprise plan templates for Government, Healthcare, Education, Media
NOTICE:  - Custom plan dashboard and monitoring views
NOTICE:  - Custom billing calculation functions
```

### **Step 6: Deploy User/Workspace Automation (If Not Already Done)**
```sql
-- 5. User and workspace automation (if not already installed)
\i user-workspace-automation.sql
```

### **Step 7: Deploy Data Validation (If Not Already Done)**
```sql
-- 6. Data validation constraints (if not already installed)
\i data-validation-constraints.sql
```

---

## ✅ **Verification and Testing**

### **1. Verify Schema Installation**
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'plan_categories', 
        'usage_counters', 
        'plan_recommendations', 
        'custom_plans', 
        'feature_flags',
        'plan_feature_matrix'
    );
```
**Expected Result:** All 6 tables should be listed.

### **2. Check Plan Categories**
```sql
-- Verify plan categories were created
SELECT name, display_name, target_audience FROM plan_categories ORDER BY sort_order;
```
**Expected Result:**
```
   name    |   display_name   |              target_audience              
-----------+------------------+-------------------------------------------
 personal  | Personal         | Individual creators, students, hobbyists
 business  | Business         | Small to medium businesses, teams, agencies
 enterprise| Enterprise       | Large enterprises, corporations, institutions
 custom    | Custom           | Organizations with unique needs
```

### **3. Check Enhanced Subscription Plans**
```sql
-- Verify enhanced subscription plans
SELECT name, plan_category, max_transcriptions_monthly, max_files_daily, max_files_monthly, price 
FROM subscription_plans 
WHERE is_active = true 
ORDER BY sort_order;
```
**Expected Result:** 8 plans with granular limits.

### **4. Test Quota Checking Functions**
```sql
-- Test quota checking function (using first user and workspace)
SELECT * FROM check_transcription_quota(
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM workspaces LIMIT 1)
);
```

### **5. Check Feature Flags**
```sql
-- Verify feature flags were created
SELECT feature_name, display_name, category, min_plan_level 
FROM feature_flags 
WHERE is_enabled = true 
ORDER BY min_plan_level, feature_name;
```

---

## 🔧 **Configuration and Customization**

### **1. Update Existing Users/Workspaces (If Needed)**
```sql
-- Backfill existing workspaces with enhanced data
SELECT * FROM backfill_workspace_initialization();

-- Backfill existing users with enhanced data  
SELECT * FROM backfill_user_initialization();
```

### **2. Set Up Automated Recommendation Generation**
```sql
-- Create a scheduled job to run recommendations daily
-- This would typically be done via cron or a job scheduler
SELECT trigger_automatic_recommendations();
```

### **3. Monitor System Health**
```sql
-- Check quota monitoring dashboard
SELECT * FROM quota_monitoring LIMIT 5;

-- Check recommendation dashboard
SELECT * FROM recommendation_dashboard LIMIT 5;

-- Check usage efficiency
SELECT * FROM usage_efficiency_monitoring 
WHERE efficiency_category != 'optimal' 
LIMIT 5;
```

---

## 📊 **Usage Examples**

### **1. Check if User Can Upload a File**
```sql
SELECT validate_file_upload(
    '12345678-1234-5678-9012-123456789012'::UUID, -- user_id
    '87654321-4321-8765-2109-876543210987'::UUID, -- workspace_id
    'mp3',          -- file_type
    52428800,       -- file_size (50MB)
    30              -- duration_minutes
);
```

### **2. Check Processing Job Capacity**
```sql
SELECT can_start_processing_job(
    '12345678-1234-5678-9012-123456789012'::UUID, -- user_id
    '87654321-4321-8765-2109-876543210987'::UUID, -- workspace_id
    'transcription' -- job_type
);
```

### **3. Generate Plan Recommendation**
```sql
SELECT * FROM generate_plan_recommendation(
    '12345678-1234-5678-9012-123456789012'::UUID, -- user_id
    '87654321-4321-8765-2109-876543210987'::UUID  -- workspace_id
);
```

### **4. Create Custom Enterprise Plan**
```sql
SELECT create_custom_enterprise_plan(
    '87654321-4321-8765-2109-876543210987'::UUID, -- workspace_id
    'ACME Corp Custom Plan',                       -- plan_name
    'Custom plan for ACME Corporation with enhanced limits',
    'enterprise_monthly',                          -- base_plan_code
    799.99,                                        -- custom_price
    '{"max_transcriptions_monthly": 100000, "max_concurrent_jobs": 100}'::JSONB,
    ARRAY['all_features', 'dedicated_support', 'custom_integration'],
    24,                                            -- contract_months
    '12345678-1234-5678-9012-123456789012'::UUID  -- requested_by
);
```

---

## 🔍 **Monitoring and Maintenance**

### **1. Daily Health Checks**
```sql
-- Check for quota violations
SELECT * FROM quota_violations;

-- Check for billing inconsistencies
SELECT * FROM billing_inconsistencies;

-- Monitor recommendation generation
SELECT COUNT(*) as pending_recommendations
FROM plan_recommendations 
WHERE status = 'pending' AND created_at > CURRENT_DATE - 7;
```

### **2. Weekly Analytics**
```sql
-- Plan distribution analysis
SELECT plan_category, COUNT(*) as workspaces, AVG(price) as avg_price
FROM subscription_plans sp
JOIN workspace_subscriptions ws ON sp.id = ws.plan_id
WHERE ws.status = 'active'
GROUP BY plan_category
ORDER BY avg_price DESC;

-- Usage efficiency trends
SELECT 
    DATE_TRUNC('week', CURRENT_DATE) as week,
    efficiency_category,
    COUNT(*) as workspace_count
FROM usage_efficiency_monitoring
GROUP BY efficiency_category
ORDER BY workspace_count DESC;
```

### **3. Monthly Cleanup**
```sql
-- Clean up expired recommendations
DELETE FROM plan_recommendations 
WHERE expires_at < CURRENT_DATE - INTERVAL '30 days'
    AND status IN ('expired', 'dismissed');

-- Reset monthly usage counters (if needed manually)
SELECT reset_usage_counters();
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Function does not exist" errors:**
   ```sql
   -- Verify functions were created
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
       AND routine_name LIKE '%quota%';
   ```

2. **Plan limits not being enforced:**
   ```sql
   -- Check if triggers are active
   SELECT trigger_name, event_manipulation, event_object_table
   FROM information_schema.triggers 
   WHERE trigger_schema = 'public';
   ```

3. **Usage counters not updating:**
   ```sql
   -- Manually test counter functions
   SELECT increment_transcription_usage(
       '12345678-1234-5678-9012-123456789012'::UUID,
       '87654321-4321-8765-2109-876543210987'::UUID,
       1
   );
   ```

### **Performance Optimization:**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Analyze table statistics
ANALYZE subscription_plans, usage_counters, plan_recommendations, custom_plans;
```

---

## 🎉 **Deployment Complete!**

Your `AudioTricks` PostgreSQL database now has a comprehensive, enterprise-grade subscription management system with:

✅ **Granular Plan Limits** - Transcriptions, files, voice synthesis, exports  
✅ **Real-Time Quota Enforcement** - Prevents overages and ensures fair usage  
✅ **AI-Powered Recommendations** - Smart upgrade suggestions based on usage patterns  
✅ **Custom Enterprise Plans** - Tailored solutions for large organizations  
✅ **Comprehensive Analytics** - Usage tracking, efficiency monitoring, cost optimization  
✅ **Automated Workflows** - User onboarding, quota resets, recommendation generation  

The system is now ready for production use with your AudioTricks application!