# AudioTricks Usage Tracking & Analytics Specification

## 📊 Overview

This specification defines the comprehensive usage tracking and analytics system for AudioTricks, enabling detailed monitoring of API usage, costs, performance metrics, and user behavior analytics.

## 🎯 Core Objectives

1. **API Usage Tracking**: Monitor all OpenAI and ElevenLabs API calls
2. **Cost Management**: Track costs per user, workspace, and operation
3. **Performance Analytics**: Monitor processing times and success rates
4. **Quota Management**: Enforce usage limits and billing controls
5. **Business Intelligence**: Provide insights for product decisions

## 📋 Usage Tracking Tables

### 1. Usage Metrics (`usage_metrics`)

**Purpose**: Central table for tracking all types of usage across the platform.

**Key Fields**:
```sql
-- Metric categorization
metric_type VARCHAR(50) -- api_call, token_usage, processing_time, storage_used, export_count
provider VARCHAR(50)    -- openai, elevenlabs, internal, system

-- Quantitative data
quantity BIGINT         -- Number of units (tokens, seconds, bytes, calls)
cost DECIMAL(10,4)     -- Cost in USD for this usage
currency VARCHAR(3)     -- USD, EUR, etc.

-- Temporal tracking
period_start TIMESTAMP  -- Start of measurement period
period_end TIMESTAMP    -- End of measurement period
recorded_at TIMESTAMP   -- When the metric was recorded
```

**Metric Types**:
- `api_call`: Individual API requests to external services
- `token_usage`: Token consumption (input/output tokens tracked separately)
- `processing_time`: Time spent on audio processing (in seconds)
- `storage_used`: Storage consumption (in bytes)
- `bandwidth_used`: Data transfer (upload/download in bytes)
- `export_count`: Number of data exports
- `feature_usage`: Feature-specific usage counters

**Usage Patterns**:
```sql
-- Track OpenAI API call
INSERT INTO usage_metrics (user_id, workspace_id, metric_type, provider, quantity, cost, period_start, period_end)
VALUES (user_id, workspace_id, 'api_call', 'openai', 1, 0.002, NOW(), NOW());

-- Track token usage
INSERT INTO usage_metrics (user_id, workspace_id, metric_type, provider, quantity, cost, metadata, period_start, period_end)
VALUES (user_id, workspace_id, 'token_usage', 'openai', 1500, 0.003, 
        '{"input_tokens": 500, "output_tokens": 1000, "model": "gpt-4"}', NOW(), NOW());
```

### 2. User Quotas (`user_quotas`)

**Purpose**: Track and enforce usage limits per user.

**Quota Types**:
- **API Calls**: Monthly limit on total API requests
- **Tokens**: Monthly token consumption limit
- **Storage**: Maximum storage allocation in MB
- **Processing Time**: Monthly processing minutes limit

**Auto-Reset Logic**:
```sql
-- Reset quotas monthly
UPDATE user_quotas 
SET current_api_calls = 0,
    current_tokens = 0,
    current_storage_mb = 0,
    current_processing_min = 0,
    last_reset_at = NOW(),
    period_start = DATE_TRUNC('month', NOW()),
    period_end = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
WHERE period_end < NOW();
```

**Overage Handling**:
- **Soft Limits**: Warning notifications when approaching limits
- **Hard Limits**: Block operations when exceeded (unless overages allowed)
- **Overage Billing**: Charge per-unit for usage beyond quotas

### 3. API Key Management (`api_key_management`)

**Purpose**: Track usage per API key for detailed cost allocation.

**Key Features**:
```sql
-- Usage tracking per key
total_requests BIGINT DEFAULT 0      -- Total API requests made
total_tokens BIGINT DEFAULT 0        -- Total tokens consumed
total_cost DECIMAL(10,4) DEFAULT 0.0 -- Total cost incurred

-- Security and lifecycle
last_used_at TIMESTAMP               -- Last usage time
expires_at TIMESTAMP                 -- Optional expiration
is_active BOOLEAN DEFAULT true       -- Enable/disable key
```

**Usage Patterns**:
```sql
-- Update API key usage
UPDATE api_key_management 
SET total_requests = total_requests + 1,
    total_tokens = total_tokens + @token_count,
    total_cost = total_cost + @request_cost,
    last_used_at = NOW()
WHERE id = @api_key_id;
```

## 📈 Analytics Aggregation Tables

### 1. Daily Usage Summaries (`daily_usage_summaries`)

**Purpose**: Pre-aggregated daily statistics for fast dashboard queries.

```sql
CREATE TABLE daily_usage_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- API Usage
    total_api_calls BIGINT DEFAULT 0,
    openai_calls BIGINT DEFAULT 0,
    elevenlabs_calls BIGINT DEFAULT 0,
    failed_calls BIGINT DEFAULT 0,
    
    -- Token Usage
    total_tokens BIGINT DEFAULT 0,
    input_tokens BIGINT DEFAULT 0,
    output_tokens BIGINT DEFAULT 0,
    
    -- Processing
    processing_time_seconds BIGINT DEFAULT 0,
    files_processed INTEGER DEFAULT 0,
    
    -- Costs
    total_cost DECIMAL(10,4) DEFAULT 0.0,
    openai_cost DECIMAL(10,4) DEFAULT 0.0,
    elevenlabs_cost DECIMAL(10,4) DEFAULT 0.0,
    
    -- Performance
    avg_processing_time DECIMAL(8,2),
    success_rate DECIMAL(4,3),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, workspace_id, date)
);

-- Indexes for analytics queries
CREATE INDEX idx_daily_summaries_user_date ON daily_usage_summaries(user_id, date DESC);
CREATE INDEX idx_daily_summaries_workspace_date ON daily_usage_summaries(workspace_id, date DESC);
```

### 2. Monthly Usage Rollups (`monthly_usage_rollups`)

**Purpose**: Monthly aggregations for billing and trend analysis.

```sql
CREATE TABLE monthly_usage_rollups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    
    -- Usage totals
    total_api_calls BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    total_processing_minutes BIGINT DEFAULT 0,
    total_storage_mb BIGINT DEFAULT 0,
    
    -- Cost totals
    total_cost DECIMAL(10,4) DEFAULT 0.0,
    
    -- Performance metrics
    avg_processing_time DECIMAL(8,2),
    success_rate DECIMAL(4,3),
    active_days INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, workspace_id, year, month)
);
```

## 🔄 Real-Time Usage Tracking

### Usage Event Pipeline

```typescript
interface UsageEvent {
  userId: string
  workspaceId?: string
  eventType: 'api_call' | 'token_usage' | 'processing_complete' | 'storage_change'
  provider: 'openai' | 'elevenlabs' | 'internal'
  quantity: number
  cost: number
  metadata?: Record<string, any>
  timestamp: Date
}

class UsageTracker {
  async recordUsage(event: UsageEvent): Promise<void> {
    // 1. Insert into usage_metrics
    await this.insertUsageMetric(event)
    
    // 2. Update user quotas
    await this.updateUserQuota(event)
    
    // 3. Update API key stats
    if (event.metadata?.apiKeyId) {
      await this.updateApiKeyUsage(event)
    }
    
    // 4. Check for quota violations
    await this.checkQuotaLimits(event.userId)
    
    // 5. Queue for aggregation
    await this.queueForAggregation(event)
  }
}
```

### Quota Enforcement

```typescript
class QuotaEnforcer {
  async checkQuota(userId: string, quotaType: string, requestedAmount: number): Promise<boolean> {
    const quota = await this.getUserQuota(userId)
    const currentUsage = await this.getCurrentUsage(userId, quotaType)
    
    if (currentUsage + requestedAmount > quota.getLimit(quotaType)) {
      if (quota.allowOverages) {
        // Calculate overage cost
        const overageAmount = (currentUsage + requestedAmount) - quota.getLimit(quotaType)
        const overageCost = overageAmount * quota.overageCostPerToken
        
        // Log overage for billing
        await this.recordOverage(userId, quotaType, overageAmount, overageCost)
        return true
      } else {
        // Block the request
        await this.logQuotaViolation(userId, quotaType, requestedAmount)
        return false
      }
    }
    
    return true
  }
}
```

## 📊 Analytics Queries

### 1. User Usage Dashboard

```sql
-- Current month usage for user dashboard
SELECT 
    DATE_TRUNC('day', recorded_at) as date,
    SUM(CASE WHEN metric_type = 'api_call' THEN quantity ELSE 0 END) as api_calls,
    SUM(CASE WHEN metric_type = 'token_usage' THEN quantity ELSE 0 END) as tokens,
    SUM(cost) as total_cost
FROM usage_metrics 
WHERE user_id = $1 
    AND recorded_at >= DATE_TRUNC('month', NOW())
GROUP BY DATE_TRUNC('day', recorded_at)
ORDER BY date;
```

### 2. Workspace Analytics

```sql
-- Workspace usage breakdown by user
SELECT 
    u.username,
    u.email,
    SUM(CASE WHEN um.metric_type = 'api_call' THEN um.quantity ELSE 0 END) as api_calls,
    SUM(CASE WHEN um.metric_type = 'token_usage' THEN um.quantity ELSE 0 END) as tokens,
    SUM(um.cost) as total_cost,
    COUNT(DISTINCT DATE(um.recorded_at)) as active_days
FROM usage_metrics um
JOIN users u ON um.user_id = u.id
WHERE um.workspace_id = $1 
    AND um.recorded_at >= $2 
    AND um.recorded_at <= $3
GROUP BY u.id, u.username, u.email
ORDER BY total_cost DESC;
```

### 3. Cost Trending

```sql
-- Monthly cost trend with year-over-year comparison
WITH monthly_costs AS (
    SELECT 
        DATE_TRUNC('month', recorded_at) as month,
        SUM(cost) as monthly_cost,
        SUM(CASE WHEN provider = 'openai' THEN cost ELSE 0 END) as openai_cost,
        SUM(CASE WHEN provider = 'elevenlabs' THEN cost ELSE 0 END) as elevenlabs_cost
    FROM usage_metrics 
    WHERE user_id = $1
    GROUP BY DATE_TRUNC('month', recorded_at)
)
SELECT 
    month,
    monthly_cost,
    openai_cost,
    elevenlabs_cost,
    LAG(monthly_cost, 12) OVER (ORDER BY month) as same_month_last_year,
    ((monthly_cost - LAG(monthly_cost, 12) OVER (ORDER BY month)) / 
     NULLIF(LAG(monthly_cost, 12) OVER (ORDER BY month), 0) * 100) as yoy_growth_percent
FROM monthly_costs 
ORDER BY month DESC;
```

### 4. Performance Analytics

```sql
-- Processing performance metrics
SELECT 
    DATE_TRUNC('hour', aj.created_at) as hour,
    COUNT(*) as total_jobs,
    AVG(EXTRACT(EPOCH FROM (aj.completed_at - aj.started_at))) as avg_processing_time,
    COUNT(CASE WHEN aj.status = 'completed' THEN 1 END)::FLOAT / COUNT(*) as success_rate,
    AVG(au.file_size / 1024.0 / 1024.0) as avg_file_size_mb
FROM processing_jobs pj
JOIN audio_uploads au ON pj.upload_id = au.id
WHERE pj.started_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', pj.started_at)
ORDER BY hour;
```

## 🔔 Usage Alerts and Notifications

### Alert Triggers

```sql
-- Create alerts table
CREATE TABLE usage_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) NOT NULL, -- quota_warning, quota_exceeded, cost_spike, performance_degradation
    severity VARCHAR(20) NOT NULL,   -- info, warning, critical
    
    threshold_value DECIMAL(15,4),
    current_value DECIMAL(15,4),
    message TEXT NOT NULL,
    
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Alert rules
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    
    rule_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    threshold_type VARCHAR(20) NOT NULL, -- percentage, absolute
    comparison_operator VARCHAR(10) NOT NULL, -- >, <, >=, <=, =
    
    notification_methods TEXT[] DEFAULT ARRAY['email'], -- email, slack, webhook
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Alert Processing

```typescript
class AlertManager {
  async checkAlerts(userId: string): Promise<void> {
    const rules = await this.getActiveAlertRules(userId)
    
    for (const rule of rules) {
      const currentValue = await this.getCurrentMetricValue(userId, rule.metricType)
      
      if (this.shouldTriggerAlert(currentValue, rule)) {
        await this.createAlert({
          userId: rule.userId,
          workspaceId: rule.workspaceId,
          alertType: this.getAlertType(rule.metricType),
          severity: this.calculateSeverity(currentValue, rule),
          thresholdValue: rule.thresholdValue,
          currentValue: currentValue,
          message: this.generateAlertMessage(rule, currentValue)
        })
        
        await this.sendNotifications(rule, currentValue)
      }
    }
  }
}
```

## 📈 Aggregation Jobs

### Daily Aggregation

```sql
-- Daily aggregation stored procedure
CREATE OR REPLACE FUNCTION aggregate_daily_usage(target_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_usage_summaries (
        user_id, workspace_id, date,
        total_api_calls, openai_calls, elevenlabs_calls,
        total_tokens, input_tokens, output_tokens,
        processing_time_seconds, files_processed,
        total_cost, openai_cost, elevenlabs_cost,
        avg_processing_time, success_rate
    )
    SELECT 
        user_id,
        workspace_id,
        target_date,
        SUM(CASE WHEN metric_type = 'api_call' THEN quantity ELSE 0 END),
        SUM(CASE WHEN metric_type = 'api_call' AND provider = 'openai' THEN quantity ELSE 0 END),
        SUM(CASE WHEN metric_type = 'api_call' AND provider = 'elevenlabs' THEN quantity ELSE 0 END),
        SUM(CASE WHEN metric_type = 'token_usage' THEN quantity ELSE 0 END),
        SUM(CASE WHEN metric_type = 'token_usage' THEN (metadata->>'input_tokens')::BIGINT ELSE 0 END),
        SUM(CASE WHEN metric_type = 'token_usage' THEN (metadata->>'output_tokens')::BIGINT ELSE 0 END),
        SUM(CASE WHEN metric_type = 'processing_time' THEN quantity ELSE 0 END),
        COUNT(DISTINCT CASE WHEN metric_type = 'processing_complete' THEN metadata->>'upload_id' END),
        SUM(cost),
        SUM(CASE WHEN provider = 'openai' THEN cost ELSE 0 END),
        SUM(CASE WHEN provider = 'elevenlabs' THEN cost ELSE 0 END),
        AVG(CASE WHEN metric_type = 'processing_time' THEN quantity END),
        COALESCE(
            COUNT(CASE WHEN metric_type = 'processing_complete' THEN 1 END)::FLOAT / 
            NULLIF(COUNT(CASE WHEN metric_type = 'processing_start' THEN 1 END), 0),
            1.0
        )
    FROM usage_metrics 
    WHERE DATE(recorded_at) = target_date
    GROUP BY user_id, workspace_id
    ON CONFLICT (user_id, workspace_id, date) 
    DO UPDATE SET 
        total_api_calls = EXCLUDED.total_api_calls,
        total_tokens = EXCLUDED.total_tokens,
        total_cost = EXCLUDED.total_cost,
        avg_processing_time = EXCLUDED.avg_processing_time,
        success_rate = EXCLUDED.success_rate;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 Usage Tracking Best Practices

### 1. Data Retention Strategy
- **Raw Usage Metrics**: Keep for 13 months (current + 12 previous)
- **Daily Summaries**: Keep for 3 years
- **Monthly Rollups**: Keep indefinitely for billing and compliance

### 2. Performance Optimization
- **Partitioning**: Partition usage_metrics by month
- **Indexing**: Optimize indexes for common query patterns
- **Archival**: Move old data to cold storage
- **Compression**: Use table compression for historical data

### 3. Data Accuracy
- **Idempotency**: Ensure usage events can be safely retried
- **Validation**: Validate all usage data before recording
- **Reconciliation**: Regular reconciliation with external API bills
- **Auditing**: Audit trail for all usage modifications

### 4. Privacy and Compliance
- **Data Anonymization**: Option to anonymize usage data
- **GDPR Compliance**: Support for data deletion requests
- **SOC 2**: Audit trails for compliance requirements
- **Encryption**: Encrypt sensitive usage metadata

This comprehensive usage tracking system provides the foundation for accurate billing, quota management, performance monitoring, and business intelligence while maintaining data accuracy and compliance requirements.