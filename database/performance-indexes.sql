-- AudioTricks Performance Optimization Indexes
-- This file contains all performance indexes for the enhanced AudioTricks database schema

-- =======================================================
-- INDEX STRATEGY OVERVIEW
-- =======================================================
/*
Index Strategy:
1. Primary Query Patterns: User dashboards, workspace analytics, billing queries
2. High-Cardinality Columns: user_id, workspace_id, timestamp columns
3. Composite Indexes: Multiple columns for complex WHERE clauses
4. Partial Indexes: Filtered indexes for common subsets
5. Covering Indexes: Include columns to avoid table lookups

Performance Priorities:
- User dashboard queries (usage metrics, recent activity)
- Billing and subscription queries
- Audio processing pipeline queries
- Security and audit log searches
- Analytics and reporting queries
*/

-- =======================================================
-- CORE USER & WORKSPACE INDEXES
-- =======================================================

-- User table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active_hash 
ON users USING HASH(email) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_active 
ON users(username) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_last_login 
ON users(role, last_login_at DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_active 
ON users(created_at DESC) WHERE is_active = true;

-- Workspace table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_slug_active 
ON workspaces(slug) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_created_active 
ON workspaces(created_at DESC) WHERE is_active = true;

-- Workspace users with activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_users_activity 
ON workspace_users(workspace_id, last_active_at DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_users_user_joined 
ON workspace_users(user_id, joined_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_users_role_workspace 
ON workspace_users(role, workspace_id) WHERE role IN ('admin', 'owner');

-- =======================================================
-- AUDIO PROCESSING INDEXES
-- =======================================================

-- Audio uploads - primary workload indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_uploads_user_status_uploaded 
ON audio_uploads(user_id, status, uploaded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_uploads_workspace_status_uploaded 
ON audio_uploads(workspace_id, status, uploaded_at DESC) WHERE workspace_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_uploads_status_processing 
ON audio_uploads(status, processing_started_at NULLS FIRST) 
WHERE status IN ('uploaded', 'processing', 'failed');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_uploads_size_duration 
ON audio_uploads(file_size, duration) WHERE status = 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_uploads_checksum 
ON audio_uploads(checksum_sha256) WHERE checksum_sha256 IS NOT NULL;

-- Audio history - user dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_history_user_created_desc 
ON audio_history(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_history_workspace_created_desc 
ON audio_history(workspace_id, created_at DESC) WHERE workspace_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_history_upload_id 
ON audio_history(upload_id) WHERE upload_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_history_duration_cost 
ON audio_history(duration_seconds, total_cost) WHERE total_cost IS NOT NULL;

-- Audio segments - transcript search and playback
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_segments_history_start_time 
ON audio_segments(history_id, start_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_segments_text_search 
ON audio_segments USING GIN(to_tsvector('english', text));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_segments_confidence 
ON audio_segments(history_id, confidence DESC) WHERE confidence IS NOT NULL;

-- Processing jobs - queue management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_jobs_queue_order 
ON processing_jobs(status, priority DESC, queued_at ASC) 
WHERE status IN ('queued', 'running');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_jobs_user_status 
ON processing_jobs(user_id, status, queued_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_jobs_upload_type 
ON processing_jobs(upload_id, job_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_jobs_retry 
ON processing_jobs(status, retry_count, queued_at) 
WHERE status = 'failed' AND retry_count < max_retries;

-- Audio chunks - large file processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_chunks_upload_processing 
ON audio_chunks(upload_id, status, chunk_index);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_chunks_status_processed 
ON audio_chunks(status, processed_at NULLS FIRST) 
WHERE status IN ('pending', 'processing');

-- =======================================================
-- USAGE TRACKING & ANALYTICS INDEXES
-- =======================================================

-- Usage metrics - billing and dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_user_period_type 
ON usage_metrics(user_id, period_start DESC, metric_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_workspace_period_type 
ON usage_metrics(workspace_id, period_start DESC, metric_type) 
WHERE workspace_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_provider_cost 
ON usage_metrics(provider, recorded_at DESC, cost) WHERE cost > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_monthly_rollup 
ON usage_metrics(user_id, DATE_TRUNC('month', period_start), metric_type);

-- Covering index for common usage queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_user_summary 
ON usage_metrics(user_id, period_start) 
INCLUDE (metric_type, quantity, cost, provider);

-- User quotas - real-time quota checking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quotas_period 
ON user_quotas(period_end) WHERE period_end > CURRENT_DATE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quotas_overage 
ON user_quotas(user_id, allow_overages) WHERE allow_overages = true;

-- API key management - authentication and usage
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_key_management_hash_active 
ON api_key_management(key_hash) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_key_management_user_provider_active 
ON api_key_management(user_id, provider, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_key_management_usage_stats 
ON api_key_management(total_requests DESC, total_cost DESC) WHERE is_active = true;

-- =======================================================
-- SUBSCRIPTION & BILLING INDEXES
-- =======================================================

-- Subscription plans - pricing page and upgrades
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_public_sort 
ON subscription_plans(is_public, sort_order) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_price_interval 
ON subscription_plans(billing_interval, price) WHERE is_active = true;

-- Workspace subscriptions - billing and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_subscriptions_status_billing 
ON workspace_subscriptions(status, next_billing_date NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_subscriptions_stripe_id 
ON workspace_subscriptions(stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_subscriptions_trial_end 
ON workspace_subscriptions(trial_end_date) 
WHERE status = 'trialing' AND trial_end_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_subscriptions_failed_payments 
ON workspace_subscriptions(failed_payment_count, next_billing_date) 
WHERE failed_payment_count > 0;

-- Billing records - invoice management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_subscription_date 
ON billing_records(subscription_id, invoice_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_status_due 
ON billing_records(status, due_date) WHERE status IN ('open', 'past_due');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_paid_amount 
ON billing_records(paid_at DESC, total_amount) WHERE status = 'paid';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_stripe_invoice 
ON billing_records(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- Usage pricing tiers - overage calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_pricing_tiers_lookup 
ON usage_pricing_tiers(plan_id, usage_type, tier_start) WHERE is_active = true;

-- Subscription changes - audit and proration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_changes_subscription_date 
ON subscription_changes(subscription_id, effective_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_changes_type_date 
ON subscription_changes(change_type, created_at DESC);

-- =======================================================
-- FILE STORAGE & MANAGEMENT INDEXES
-- =======================================================

-- Storage quotas - real-time quota checking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_storage_quotas_usage 
ON storage_quotas(workspace_id, current_storage_bytes, max_storage_bytes);

-- File processing cache - performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_processing_cache_lookup 
ON file_processing_cache(file_hash, processing_options_hash, cache_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_processing_cache_cleanup 
ON file_processing_cache(expires_at, created_at) WHERE expires_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_processing_cache_access 
ON file_processing_cache(accessed_at DESC, access_count) WHERE access_count > 1;

-- =======================================================
-- AUDIT & SECURITY INDEXES
-- =======================================================

-- Audit logs - security monitoring and compliance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action_created 
ON audit_logs(user_id, action, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_workspace_action_created 
ON audit_logs(workspace_id, action, created_at DESC) WHERE workspace_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_created 
ON audit_logs(resource, resource_id, created_at DESC) WHERE resource_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_category_severity 
ON audit_logs(category, severity, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_ip_created 
ON audit_logs(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- Security events - threat detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_type_created 
ON security_events(user_id, event_type, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_threat_level_created 
ON security_events(threat_level, created_at DESC) WHERE threat_level IN ('high', 'critical');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_unresolved 
ON security_events(event_type, created_at DESC) WHERE resolved_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_ip_type 
ON security_events(ip_address, event_type, created_at DESC) WHERE ip_address IS NOT NULL;

-- Data access logs - compliance and monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_access_logs_user_accessed 
ON data_access_logs(user_id, accessed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_access_logs_resource_accessed 
ON data_access_logs(resource_type, resource_id, accessed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_access_logs_pii_accessed 
ON data_access_logs(contains_pii, accessed_at DESC) WHERE contains_pii = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_access_logs_classification 
ON data_access_logs(data_classification, accessed_at DESC) 
WHERE data_classification IN ('confidential', 'restricted');

-- Administrative actions - privileged operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_actions_admin_created 
ON admin_actions(admin_user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_actions_target_created 
ON admin_actions(target_user_id, created_at DESC) WHERE target_user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_actions_type_risk 
ON admin_actions(action_type, risk_level, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_actions_approval_status 
ON admin_actions(approval_status, created_at DESC) WHERE approval_required = true;

-- =======================================================
-- EXPORT & SHARING INDEXES
-- =======================================================

-- Export history - user downloads and compliance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_history_user_created 
ON export_history(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_history_status_expires 
ON export_history(status, expires_at NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_history_type_created 
ON export_history(export_type, data_type, created_at DESC);

-- =======================================================
-- PROJECT MANAGEMENT INDEXES
-- =======================================================

-- Audio projects - organization and collaboration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_projects_user_status_created 
ON audio_projects(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_projects_workspace_status_created 
ON audio_projects(workspace_id, status, created_at DESC) WHERE workspace_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_projects_public_created 
ON audio_projects(is_public, created_at DESC) WHERE is_public = true;

-- =======================================================
-- SPECIALIZED ANALYTICS INDEXES
-- =======================================================

-- Time-series analytics optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_hourly_rollup 
ON usage_metrics(DATE_TRUNC('hour', recorded_at), metric_type, provider);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_daily_rollup 
ON usage_metrics(DATE_TRUNC('day', recorded_at), user_id, metric_type);

-- Revenue analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_revenue_analysis 
ON billing_records(invoice_date, status) 
INCLUDE (total_amount, currency) WHERE status = 'paid';

-- User behavior analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_activity_pattern 
ON audit_logs(user_id, DATE_TRUNC('day', created_at), action) 
WHERE action IN ('login', 'logout', 'upload', 'download');

-- =======================================================
-- PERFORMANCE MONITORING INDEXES
-- =======================================================

-- Processing performance analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_jobs_performance 
ON processing_jobs(job_type, execution_duration_ms, completed_at) 
WHERE execution_status = 'success' AND execution_duration_ms IS NOT NULL;

-- API performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_api_performance 
ON audit_logs(api_endpoint, processing_time_ms, created_at) 
WHERE api_endpoint IS NOT NULL AND processing_time_ms IS NOT NULL;

-- =======================================================
-- FULL-TEXT SEARCH INDEXES
-- =======================================================

-- Audio content search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_history_title_search 
ON audio_history USING GIN(to_tsvector('english', COALESCE(title, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_history_summary_search 
ON audio_history USING GIN(to_tsvector('english', COALESCE(summary, '')));

-- User and workspace search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search 
ON users USING GIN(to_tsvector('english', username || ' ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_search 
ON workspaces USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =======================================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- =======================================================

-- Active sessions only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active 
ON sessions(user_id, created_at DESC) WHERE expires_at > CURRENT_TIMESTAMP;

-- Failed processing jobs for retry
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_jobs_failed_retry 
ON processing_jobs(queued_at ASC) 
WHERE status = 'failed' AND retry_count < max_retries;

-- Recent security events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_recent 
ON security_events(event_type, threat_level, created_at DESC) 
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Active subscriptions for billing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_subscriptions_billable 
ON workspace_subscriptions(next_billing_date ASC) 
WHERE status IN ('active', 'past_due') AND next_billing_date IS NOT NULL;

-- Large files for optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_uploads_large_files 
ON audio_uploads(file_size DESC, uploaded_at DESC) 
WHERE file_size > 52428800; -- Files larger than 50MB

-- =======================================================
-- COVERING INDEXES FOR SPECIFIC QUERIES
-- =======================================================

-- User dashboard summary (avoid table lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_metrics_dashboard_summary 
ON usage_metrics(user_id, period_start DESC) 
INCLUDE (metric_type, quantity, cost, provider) 
WHERE period_start >= CURRENT_DATE - INTERVAL '30 days';

-- Workspace analytics summary
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_analytics_summary 
ON usage_metrics(workspace_id, DATE_TRUNC('day', period_start)) 
INCLUDE (metric_type, quantity, cost, user_id) 
WHERE workspace_id IS NOT NULL;

-- Billing summary
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_summary 
ON billing_records(subscription_id, invoice_date DESC) 
INCLUDE (status, total_amount, invoice_number);

-- =======================================================
-- INDEX MAINTENANCE NOTES
-- =======================================================

/*
Index Maintenance Schedule:

1. Daily (automated):
   - REINDEX CONCURRENTLY on heavily updated indexes
   - UPDATE statistics on usage_metrics, audit_logs

2. Weekly (automated):
   - VACUUM ANALYZE on all tables
   - Check for unused indexes
   - Monitor index bloat

3. Monthly (manual review):
   - Analyze query performance
   - Review slow query logs
   - Consider new indexes based on usage patterns
   - Drop unused indexes

4. Quarterly (planned maintenance):
   - Full REINDEX during maintenance window
   - Update PostgreSQL statistics targets
   - Review and optimize materialized views

Performance Monitoring Queries:

-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 AND idx_tup_read = 0;

-- Find duplicate indexes
SELECT DISTINCT t1.indexname, t2.indexname, t1.tablename
FROM pg_indexes t1, pg_indexes t2
WHERE t1.indexname != t2.indexname
  AND t1.tablename = t2.tablename
  AND t1.indexdef = t2.indexdef;

-- Monitor index usage
SELECT tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
*/

-- =======================================================
-- INDEX VALIDATION AND MONITORING
-- =======================================================

-- Create a view to monitor index effectiveness
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_table_performance(table_name TEXT)
RETURNS TABLE (
    operation TEXT,
    avg_time_ms NUMERIC,
    total_calls BIGINT,
    total_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.action,
        AVG(al.processing_time_ms)::NUMERIC,
        COUNT(*)::BIGINT,
        SUM(al.processing_time_ms)::NUMERIC
    FROM audit_logs al
    WHERE al.resource = table_name
        AND al.processing_time_ms IS NOT NULL
        AND al.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
    GROUP BY al.action
    ORDER BY AVG(al.processing_time_ms) DESC;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'AudioTricks performance indexes created successfully!';
RAISE NOTICE 'Total indexes created: Approximately 100+ specialized indexes';
RAISE NOTICE 'Remember to:';
RAISE NOTICE '1. Monitor index usage with the index_usage_stats view';
RAISE NOTICE '2. Set up automated REINDEX jobs for high-write tables';
RAISE NOTICE '3. Review query performance regularly';
RAISE NOTICE '4. Update table statistics after bulk data loads';