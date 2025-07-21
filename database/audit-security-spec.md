# AudioTricks Audit Logging & Security Specification

## 🔐 Overview

This specification defines the comprehensive audit logging and security monitoring system for AudioTricks, ensuring complete traceability of user actions, system events, security incidents, and compliance with regulatory requirements like SOC 2, GDPR, and HIPAA.

## 🎯 Core Objectives

1. **Complete Audit Trail**: Track all user actions and system events
2. **Security Monitoring**: Detect and respond to security threats
3. **Compliance Support**: Meet regulatory requirements for data protection
4. **Incident Response**: Enable forensic analysis and incident investigation
5. **Data Integrity**: Ensure audit logs cannot be tampered with
6. **Performance**: Efficient logging without impacting system performance

## 📋 Audit Logging Tables

### 1. Audit Logs (`audit_logs`)

**Purpose**: Central repository for all system events and user actions.

**Event Classification**:
```sql
-- Event categorization
action VARCHAR(100) NOT NULL        -- create, update, delete, view, login, logout, export
resource VARCHAR(100) NOT NULL      -- user, workspace, audio_file, subscription, etc.
resource_id UUID                    -- ID of the affected resource
resource_type VARCHAR(50)           -- Specific resource subtype

-- Event context
category VARCHAR(50)                -- security, data, system, user_action, admin_action
severity VARCHAR(20) DEFAULT 'info' -- debug, info, warn, error, critical
outcome VARCHAR(20) DEFAULT 'success' -- success, failure, partial

-- Request information
ip_address INET                     -- Client IP address
user_agent TEXT                     -- Browser/client information
request_id VARCHAR(100)             -- Unique request identifier
session_id VARCHAR(100)             -- Session identifier
api_endpoint VARCHAR(200)           -- API endpoint if applicable
http_method VARCHAR(10)             -- GET, POST, PUT, DELETE, etc.
```

**Event Details**:
```sql
-- Change tracking
old_values JSONB                    -- Previous state of modified data
new_values JSONB                    -- New state of modified data
diff_summary TEXT                   -- Human-readable summary of changes

-- Additional context
details JSONB DEFAULT '{}'          -- Flexible additional event data
metadata JSONB DEFAULT '{}'         -- System-generated metadata
tags TEXT[]                         -- Searchable tags for categorization

-- Timing and location
created_at TIMESTAMP DEFAULT NOW()  -- When event occurred
processing_time_ms INTEGER          -- How long the operation took
timezone VARCHAR(50)                -- User's timezone
```

**Standard Event Types**:

**Authentication Events**:
```sql
-- Login success
{
  "action": "login",
  "resource": "user",
  "category": "security",
  "outcome": "success",
  "details": {
    "method": "password",
    "remember_me": true,
    "two_factor_used": false
  }
}

-- Failed login attempt
{
  "action": "login",
  "resource": "user", 
  "category": "security",
  "outcome": "failure",
  "severity": "warn",
  "details": {
    "failure_reason": "invalid_password",
    "attempt_count": 3
  }
}
```

**Data Operations**:
```sql
-- File upload
{
  "action": "create",
  "resource": "audio_file",
  "category": "data",
  "details": {
    "filename": "meeting_recording.mp3",
    "file_size": 15728640,
    "duration": 1800,
    "workspace_id": "uuid"
  }
}

-- Data export
{
  "action": "export",
  "resource": "user_data",
  "category": "data",
  "severity": "info",
  "details": {
    "export_type": "json",
    "date_range": "2024-01-01_to_2024-12-31",
    "record_count": 150,
    "file_size": 2048576
  }
}
```

### 2. Security Events (`security_events`)

**Purpose**: Track security-related incidents and potential threats.

**Security Event Types**:
```sql
-- Event classification
event_type VARCHAR(100) NOT NULL    -- failed_login, account_locked, suspicious_activity, etc.
threat_level VARCHAR(20) DEFAULT 'low' -- low, medium, high, critical
detection_method VARCHAR(50)        -- automated, manual, third_party

-- Incident details
description TEXT                    -- Human-readable description
attack_vector VARCHAR(100)          -- bruteforce, injection, social_engineering, etc.
indicators JSONB                    -- Technical indicators of compromise
affected_resources TEXT[]           -- List of affected resource IDs

-- Response tracking
is_acknowledged BOOLEAN DEFAULT false
acknowledged_at TIMESTAMP
acknowledged_by UUID REFERENCES users(id)
response_actions JSONB             -- Actions taken in response
resolution_status VARCHAR(50)      -- open, investigating, resolved, false_positive

-- External context
source_system VARCHAR(50)          -- System that detected the event
reference_id VARCHAR(100)          -- External reference (SIEM, IDS, etc.)
related_events UUID[]              -- Links to related security events
```

**Automated Detection Rules**:
```sql
-- Multiple failed logins
CREATE OR REPLACE FUNCTION detect_brute_force_login()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action = 'login' AND NEW.outcome = 'failure' THEN
        -- Check for multiple failures from same IP in last hour
        IF (
            SELECT COUNT(*) 
            FROM audit_logs 
            WHERE action = 'login' 
                AND outcome = 'failure'
                AND ip_address = NEW.ip_address
                AND created_at > NOW() - INTERVAL '1 hour'
        ) >= 5 THEN
            -- Create security event
            INSERT INTO security_events (
                user_id, event_type, threat_level, description,
                ip_address, user_agent, indicators
            ) VALUES (
                NEW.user_id,
                'brute_force_login',
                'high',
                'Multiple failed login attempts detected',
                NEW.ip_address,
                NEW.user_agent,
                jsonb_build_object(
                    'failed_attempts', 5,
                    'time_window', '1 hour',
                    'detection_rule', 'brute_force_login'
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_detect_brute_force 
AFTER INSERT ON audit_logs 
FOR EACH ROW EXECUTE FUNCTION detect_brute_force_login();
```

### 3. Data Access Logs (`data_access_logs`)

**Purpose**: Track all access to sensitive data for compliance and security.

```sql
CREATE TABLE data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Access details
    access_type VARCHAR(50) NOT NULL,   -- read, download, stream, preview
    resource_type VARCHAR(50) NOT NULL, -- transcript, audio_file, summary, user_data
    resource_id UUID NOT NULL,
    
    -- Data classification
    data_classification VARCHAR(50),    -- public, internal, confidential, restricted
    contains_pii BOOLEAN DEFAULT false,
    contains_phi BOOLEAN DEFAULT false, -- Protected Health Information
    
    -- Access context
    access_method VARCHAR(50),          -- web_ui, api, export, email
    purpose VARCHAR(100),               -- user_request, automated_processing, support
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    api_key_id UUID,                    -- If accessed via API
    
    -- Data details
    data_size_bytes BIGINT,
    fields_accessed TEXT[],             -- Specific fields accessed
    query_filters JSONB,               -- Filters applied to data access
    
    -- Timing and compliance
    accessed_at TIMESTAMP DEFAULT NOW(),
    retention_date DATE,                -- When this log should be deleted
    legal_hold BOOLEAN DEFAULT false,   -- Cannot be deleted due to legal hold
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes for compliance queries
CREATE INDEX idx_data_access_user_time ON data_access_logs(user_id, accessed_at DESC);
CREATE INDEX idx_data_access_resource ON data_access_logs(resource_type, resource_id);
CREATE INDEX idx_data_access_pii ON data_access_logs(contains_pii, accessed_at) WHERE contains_pii = true;
CREATE INDEX idx_data_access_phi ON data_access_logs(contains_phi, accessed_at) WHERE contains_phi = true;
```

### 4. Administrative Actions (`admin_actions`)

**Purpose**: Track all administrative and privileged operations.

```sql
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    target_workspace_id UUID REFERENCES workspaces(id),
    
    -- Action details
    action_type VARCHAR(100) NOT NULL,  -- user_impersonation, data_deletion, system_config
    action_category VARCHAR(50),        -- user_management, system_admin, compliance
    
    -- Administrative context
    reason TEXT,                        -- Justification for the action
    approval_required BOOLEAN DEFAULT true,
    approval_status VARCHAR(50),        -- pending, approved, denied
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Impact assessment
    risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    affected_users INTEGER DEFAULT 0,
    affected_data_size BIGINT DEFAULT 0,
    reversible BOOLEAN DEFAULT true,
    
    -- Execution details
    executed_at TIMESTAMP,
    execution_duration_ms INTEGER,
    execution_status VARCHAR(50),       -- success, failure, partial
    error_message TEXT,
    
    -- Audit and compliance
    ticket_reference VARCHAR(100),      -- Support ticket or change request
    compliance_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Change tracking
    before_state JSONB,
    after_state JSONB
);
```

### 5. Data Retention Policies (`data_retention_policies`)

**Purpose**: Define and enforce data retention rules for compliance.

```sql
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Policy identification
    policy_name VARCHAR(100) UNIQUE NOT NULL,
    policy_version VARCHAR(20) DEFAULT '1.0',
    description TEXT,
    
    -- Scope definition
    data_types TEXT[] NOT NULL,         -- audit_logs, user_data, audio_files, etc.
    applies_to_workspaces UUID[],       -- Empty = all workspaces
    applies_to_regions TEXT[],          -- Geographic restrictions
    
    -- Retention rules
    retention_period_days INTEGER NOT NULL,
    retention_start_trigger VARCHAR(50), -- created, last_accessed, user_deleted
    
    -- Lifecycle actions
    auto_delete BOOLEAN DEFAULT false,
    archive_before_delete BOOLEAN DEFAULT true,
    anonymize_before_delete BOOLEAN DEFAULT false,
    notify_before_deletion_days INTEGER DEFAULT 30,
    
    -- Legal and compliance
    legal_basis VARCHAR(100),           -- GDPR legal basis
    override_user_deletion BOOLEAN DEFAULT false,
    minimum_retention_days INTEGER,    -- Cannot delete before this
    
    -- Processing details
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Default GDPR-compliant policies
INSERT INTO data_retention_policies (
    policy_name, description, data_types, retention_period_days,
    legal_basis, auto_delete
) VALUES 
(
    'User Audio Files Retention',
    'Audio files retained for processing and user access',
    ARRAY['audio_files', 'transcripts', 'summaries'],
    2555, -- 7 years
    'Contract',
    true
),
(
    'Security Audit Logs',
    'Security events retained for compliance and forensics',
    ARRAY['security_events', 'login_logs'],
    2555, -- 7 years
    'Legitimate Interest',
    false
),
(
    'General Audit Trail',
    'Standard audit logs for operational monitoring',
    ARRAY['audit_logs'],
    365, -- 1 year
    'Legitimate Interest',
    true
);
```

## 🔍 Security Monitoring and Alerting

### 1. Real-Time Security Monitoring

```typescript
interface SecurityMonitor {
  monitorLoginAttempts(userId: string, ipAddress: string): Promise<void>
  detectAnomalousActivity(userId: string, activity: UserActivity): Promise<SecurityThreat[]>
  checkDataAccessPatterns(userId: string, accessLog: DataAccessLog): Promise<void>
  validateApiUsage(apiKeyId: string, request: ApiRequest): Promise<void>
}

class SecurityMonitoringService implements SecurityMonitor {
  async monitorLoginAttempts(userId: string, ipAddress: string): Promise<void> {
    // Check for unusual login patterns
    const recentLogins = await this.getRecentLogins(userId, '24 hours')
    
    // Geographic anomaly detection
    const knownLocations = await this.getUserKnownLocations(userId)
    const currentLocation = await this.getLocationFromIP(ipAddress)
    
    if (!this.isLocationFamiliar(currentLocation, knownLocations)) {
      await this.createSecurityEvent({
        userId,
        eventType: 'unusual_location_login',
        threatLevel: 'medium',
        description: `Login from unusual location: ${currentLocation.city}, ${currentLocation.country}`,
        ipAddress,
        indicators: {
          location: currentLocation,
          knownLocations,
          geoDistance: this.calculateDistance(currentLocation, knownLocations[0])
        }
      })
    }
    
    // Time-based anomaly detection
    const typicalLoginHours = await this.getUserTypicalLoginHours(userId)
    const currentHour = new Date().getHours()
    
    if (!this.isTypicalLoginTime(currentHour, typicalLoginHours)) {
      await this.createSecurityEvent({
        userId,
        eventType: 'unusual_time_login',
        threatLevel: 'low',
        description: `Login at unusual time: ${currentHour}:00`,
        indicators: {
          loginHour: currentHour,
          typicalHours: typicalLoginHours
        }
      })
    }
  }
  
  async detectAnomalousActivity(userId: string, activity: UserActivity): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []
    
    // Mass data download detection
    if (activity.type === 'data_download') {
      const recentDownloads = await this.getRecentDownloads(userId, '1 hour')
      const totalSize = recentDownloads.reduce((sum, d) => sum + d.size, 0)
      
      if (totalSize > 100 * 1024 * 1024) { // 100MB in 1 hour
        threats.push({
          type: 'mass_data_exfiltration',
          severity: 'high',
          description: `User downloaded ${Math.round(totalSize / 1024 / 1024)}MB in 1 hour`,
          indicators: { totalSize, downloadCount: recentDownloads.length }
        })
      }
    }
    
    // Unusual API usage patterns
    if (activity.type === 'api_request') {
      const apiUsage = await this.getRecentApiUsage(userId, '1 hour')
      const requestRate = apiUsage.length / 60 // requests per minute
      
      if (requestRate > 100) { // More than 100 requests per minute
        threats.push({
          type: 'api_abuse',
          severity: 'medium',
          description: `Unusual API usage rate: ${requestRate} req/min`,
          indicators: { requestRate, totalRequests: apiUsage.length }
        })
      }
    }
    
    return threats
  }
  
  async auditDataAccess(accessLog: DataAccessLog): Promise<void> {
    // Log all data access for compliance
    await this.prisma.dataAccessLog.create({
      data: {
        userId: accessLog.userId,
        workspaceId: accessLog.workspaceId,
        accessType: accessLog.type,
        resourceType: accessLog.resourceType,
        resourceId: accessLog.resourceId,
        dataClassification: await this.classifyData(accessLog.resourceId),
        containsPii: await this.checkForPII(accessLog.resourceId),
        accessMethod: accessLog.method,
        ipAddress: accessLog.ipAddress,
        userAgent: accessLog.userAgent,
        dataSizeBytes: accessLog.dataSize
      }
    })
    
    // Check for suspicious access patterns
    await this.analyzeAccessPattern(accessLog)
  }
}
```

### 2. Compliance Reporting

```typescript
class ComplianceReporter {
  async generateGDPRReport(userId: string, requestType: 'access' | 'deletion'): Promise<ComplianceReport> {
    const userData = {
      personalInfo: await this.getUserPersonalInfo(userId),
      audioFiles: await this.getUserAudioFiles(userId),
      transcripts: await this.getUserTranscripts(userId),
      usageHistory: await this.getUserUsageHistory(userId),
      auditTrail: await this.getUserAuditTrail(userId)
    }
    
    const accessLogs = await this.getDataAccessLogs(userId)
    const retentionPolicies = await this.getApplicableRetentionPolicies(userId)
    
    return {
      requestType,
      userId,
      generatedAt: new Date(),
      personalData: userData,
      dataAccessHistory: accessLogs,
      retentionInfo: retentionPolicies,
      legalBasis: await this.getLegalBasisForProcessing(userId),
      dataProcessors: await this.getThirdPartyProcessors(),
      retentionSchedule: await this.calculateRetentionSchedule(userId)
    }
  }
  
  async generateSOC2Report(startDate: Date, endDate: Date): Promise<SOC2Report> {
    return {
      reportPeriod: { startDate, endDate },
      
      // Trust Service Criteria
      security: {
        accessControls: await this.getAccessControlEvents(startDate, endDate),
        authenticationEvents: await this.getAuthenticationReport(startDate, endDate),
        networkSecurity: await this.getNetworkSecurityEvents(startDate, endDate),
        incidentResponse: await this.getSecurityIncidents(startDate, endDate)
      },
      
      availability: {
        systemUptime: await this.getSystemUptimeReport(startDate, endDate),
        performanceMetrics: await this.getPerformanceMetrics(startDate, endDate),
        capacityManagement: await this.getCapacityReport(startDate, endDate)
      },
      
      processing: {
        dataIntegrity: await this.getDataIntegrityReport(startDate, endDate),
        processingAccuracy: await this.getProcessingAccuracyReport(startDate, endDate),
        errorRates: await this.getErrorRateReport(startDate, endDate)
      },
      
      confidentiality: {
        encryptionStatus: await this.getEncryptionReport(),
        accessRestrictions: await this.getAccessRestrictionReport(startDate, endDate),
        dataClassification: await this.getDataClassificationReport()
      },
      
      privacy: {
        consentManagement: await this.getConsentReport(startDate, endDate),
        dataRetention: await this.getRetentionComplianceReport(startDate, endDate),
        dataMinimization: await this.getDataMinimizationReport(startDate, endDate)
      }
    }
  }
}
```

### 3. Automated Compliance Enforcement

```typescript
class ComplianceEnforcer {
  async enforceRetentionPolicies(): Promise<void> {
    const policies = await this.getActiveRetentionPolicies()
    
    for (const policy of policies) {
      await this.processRetentionPolicy(policy)
    }
  }
  
  private async processRetentionPolicy(policy: RetentionPolicy): Promise<void> {
    const expiredData = await this.findExpiredData(policy)
    
    for (const dataItem of expiredData) {
      if (policy.notifyBeforeDeletionDays > 0) {
        const notificationDate = new Date()
        notificationDate.setDate(notificationDate.getDate() - policy.notifyBeforeDeletionDays)
        
        if (dataItem.createdAt <= notificationDate) {
          await this.sendDeletionNotification(dataItem, policy)
        }
      }
      
      if (policy.archiveBeforeDelete) {
        await this.archiveData(dataItem)
      }
      
      if (policy.anonymizeBeforeDelete) {
        await this.anonymizeData(dataItem)
      } else if (policy.autoDelete) {
        await this.deleteData(dataItem)
      }
      
      // Log compliance action
      await this.logComplianceAction({
        policyId: policy.id,
        dataId: dataItem.id,
        action: policy.autoDelete ? 'deleted' : 'archived',
        reason: 'retention_policy_enforcement'
      })
    }
    
    // Update policy execution tracking
    await this.updatePolicyExecution(policy.id)
  }
  
  async handleDataDeletionRequest(userId: string, requestType: 'user_request' | 'admin_action'): Promise<void> {
    // Find all user data
    const userData = await this.findAllUserData(userId)
    
    // Check for legal holds
    const legalHolds = await this.checkLegalHolds(userId)
    if (legalHolds.length > 0) {
      throw new Error(`Cannot delete data due to legal holds: ${legalHolds.join(', ')}`)
    }
    
    // Check minimum retention requirements
    const minRetentionViolations = await this.checkMinimumRetention(userData)
    if (minRetentionViolations.length > 0) {
      throw new Error(`Cannot delete data before minimum retention period`)
    }
    
    // Process deletion in phases
    await this.deleteUserPersonalData(userId)
    await this.anonymizeUserAudioData(userId)
    await this.deleteUserSessions(userId)
    await this.updateUserAccountStatus(userId, 'deleted')
    
    // Log deletion for compliance
    await this.logDataDeletion({
      userId,
      requestType,
      deletedAt: new Date(),
      dataTypes: userData.map(d => d.type),
      legalBasis: 'user_request'
    })
  }
}
```

## 📊 Audit Analytics and Reporting

### 1. Security Dashboard Queries

```sql
-- Failed login attempts by IP address (last 24 hours)
SELECT 
    ip_address,
    COUNT(*) as failed_attempts,
    COUNT(DISTINCT user_id) as affected_users,
    MIN(created_at) as first_attempt,
    MAX(created_at) as last_attempt,
    array_agg(DISTINCT user_agent) as user_agents
FROM audit_logs 
WHERE action = 'login' 
    AND outcome = 'failure'
    AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;

-- Unusual data access patterns
WITH user_access_patterns AS (
    SELECT 
        user_id,
        DATE_TRUNC('hour', accessed_at) as hour,
        COUNT(*) as access_count,
        SUM(data_size_bytes) as total_bytes,
        COUNT(DISTINCT resource_id) as unique_resources
    FROM data_access_logs
    WHERE accessed_at > NOW() - INTERVAL '24 hours'
    GROUP BY user_id, DATE_TRUNC('hour', accessed_at)
),
user_baselines AS (
    SELECT 
        user_id,
        AVG(access_count) as avg_hourly_access,
        STDDEV(access_count) as stddev_access,
        AVG(total_bytes) as avg_hourly_bytes
    FROM data_access_logs
    WHERE accessed_at > NOW() - INTERVAL '7 days'
        AND accessed_at <= NOW() - INTERVAL '24 hours'
    GROUP BY user_id
)
SELECT 
    uap.user_id,
    uap.hour,
    uap.access_count,
    ub.avg_hourly_access,
    (uap.access_count - ub.avg_hourly_access) / NULLIF(ub.stddev_access, 0) as z_score,
    uap.total_bytes,
    ub.avg_hourly_bytes
FROM user_access_patterns uap
JOIN user_baselines ub ON uap.user_id = ub.user_id
WHERE (uap.access_count - ub.avg_hourly_access) / NULLIF(ub.stddev_access, 0) > 3
ORDER BY z_score DESC;
```

### 2. Compliance Metrics

```sql
-- Data retention compliance status
WITH retention_status AS (
    SELECT 
        drp.policy_name,
        drp.data_types,
        drp.retention_period_days,
        COUNT(CASE WHEN ah.created_at < NOW() - (drp.retention_period_days || ' days')::INTERVAL 
              THEN 1 END) as overdue_records,
        COUNT(*) as total_records,
        drp.last_run_at,
        drp.next_run_at
    FROM data_retention_policies drp
    CROSS JOIN audio_history ah
    WHERE drp.is_active = true
        AND 'audio_files' = ANY(drp.data_types)
    GROUP BY drp.id, drp.policy_name, drp.data_types, drp.retention_period_days, 
             drp.last_run_at, drp.next_run_at
)
SELECT 
    policy_name,
    retention_period_days,
    total_records,
    overdue_records,
    ROUND((overdue_records::FLOAT / total_records) * 100, 2) as non_compliance_percentage,
    last_run_at,
    next_run_at,
    CASE 
        WHEN overdue_records = 0 THEN 'COMPLIANT'
        WHEN overdue_records < total_records * 0.05 THEN 'MOSTLY_COMPLIANT'
        ELSE 'NON_COMPLIANT'
    END as compliance_status
FROM retention_status;

-- GDPR data subject requests tracking
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN request_type = 'access' THEN 1 END) as access_requests,
    COUNT(CASE WHEN request_type = 'deletion' THEN 1 END) as deletion_requests,
    COUNT(CASE WHEN request_type = 'rectification' THEN 1 END) as rectification_requests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
    AVG(EXTRACT(DAYS FROM completed_at - created_at)) as avg_completion_days
FROM data_subject_requests 
WHERE created_at > NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

This comprehensive audit logging and security system provides complete visibility into system operations, enables compliance with regulatory requirements, and supports proactive security monitoring and incident response.