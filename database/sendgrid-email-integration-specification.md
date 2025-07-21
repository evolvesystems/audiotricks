# AudioTricks SendGrid Email Integration - Complete Specification

## 🎯 **Executive Summary**

This specification defines a comprehensive SendGrid email integration for AudioTricks, providing automated transactional emails, user engagement notifications, and enterprise-grade email automation. The system will enhance user experience through timely notifications, improve platform engagement, and support business growth through sophisticated email marketing automation.

---

## 📧 **Email System Architecture**

### **Core Email Categories**

**🔐 Authentication & Onboarding**
- Welcome emails with platform orientation
- Email verification and account activation
- Password reset and security notifications
- Two-factor authentication setup reminders

**🏢 Workspace Management**
- Workspace invitation emails with customizable branding
- Team member addition/removal notifications
- Role change notifications (member → admin → owner)
- Workspace setting change confirmations

**🎵 Audio Processing Notifications**
- Upload confirmation emails
- Processing completion with summary preview
- Processing failure notifications with error guidance
- Large file processing status updates

**💳 Subscription & Billing**
- Trial expiration warnings (7-day, 3-day, 1-day)
- Subscription upgrade/downgrade confirmations
- Payment success and failure notifications
- Invoice generation and delivery
- Usage quota warnings (80%, 95%, 100%)

**🤖 AI & Chatbot Integration**
- Weekly transcript summary emails
- Chatbot conversation digest
- AI-generated insights and trends
- Custom alert notifications

---

## 💾 **Database Schema Design**

### **Email Management Tables**

```sql
-- Email templates with dynamic content support
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template Identity
    template_code VARCHAR(100) UNIQUE NOT NULL, -- welcome_user, workspace_invite, etc.
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- auth, workspace, processing, billing, ai
    
    -- SendGrid Integration
    sendgrid_template_id VARCHAR(100), -- External SendGrid template ID
    
    -- Template Content
    subject_template TEXT NOT NULL,
    html_content TEXT,
    text_content TEXT,
    
    -- Dynamic Variables
    required_variables TEXT[] DEFAULT ARRAY[]::TEXT[], -- user_name, workspace_name, etc.
    optional_variables TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Personalization & Branding
    supports_workspace_branding BOOLEAN DEFAULT false,
    supports_user_preferences BOOLEAN DEFAULT true,
    
    -- Status and Versioning
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT chk_email_category CHECK (category IN ('auth', 'workspace', 'processing', 'billing', 'ai', 'marketing'))
);

-- Email sending queue and delivery tracking
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient Information
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    
    -- Email Details
    template_code VARCHAR(100) NOT NULL REFERENCES email_templates(template_code),
    subject VARCHAR(500) NOT NULL,
    
    -- SendGrid Details
    sendgrid_message_id VARCHAR(255),
    sendgrid_template_id VARCHAR(100),
    
    -- Dynamic Content
    template_data JSONB DEFAULT '{}',
    personalization_data JSONB DEFAULT '{}',
    
    -- Scheduling
    send_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP,
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'queued', -- queued, sending, sent, delivered, bounced, failed
    priority INTEGER DEFAULT 5, -- 1-10, higher is more urgent
    
    -- Delivery Details
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_email_status CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'bounced', 'failed', 'cancelled')),
    CONSTRAINT chk_priority CHECK (priority BETWEEN 1 AND 10)
);

-- Email delivery tracking and analytics
CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Message Reference
    email_queue_id UUID REFERENCES email_queue(id) ON DELETE CASCADE,
    sendgrid_message_id VARCHAR(255),
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL, -- delivered, bounced, opened, clicked, unsubscribed, etc.
    event_data JSONB DEFAULT '{}',
    
    -- Recipient Info
    recipient_email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    
    -- Timing
    event_timestamp TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional Details
    user_agent TEXT,
    ip_address INET,
    location_data JSONB,
    
    -- Constraints
    CONSTRAINT chk_event_type CHECK (event_type IN ('processed', 'delivered', 'bounced', 'opened', 'clicked', 'unsubscribed', 'spamreport'))
);

-- User email preferences and subscription management
CREATE TABLE IF NOT EXISTS email_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Global Preferences
    marketing_emails BOOLEAN DEFAULT true,
    processing_notifications BOOLEAN DEFAULT true,
    workspace_notifications BOOLEAN DEFAULT true,
    billing_notifications BOOLEAN DEFAULT true,
    ai_insights BOOLEAN DEFAULT true,
    
    -- Frequency Preferences
    digest_frequency VARCHAR(20) DEFAULT 'weekly', -- never, daily, weekly, monthly
    digest_day_of_week INTEGER DEFAULT 1, -- 1=Monday, 7=Sunday
    digest_time TIME DEFAULT '09:00:00',
    
    -- Content Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Unsubscribe Management
    global_unsubscribe BOOLEAN DEFAULT false,
    unsubscribe_date TIMESTAMP,
    unsubscribe_reason TEXT,
    
    -- Metadata
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_digest_frequency CHECK (digest_frequency IN ('never', 'daily', 'weekly', 'monthly')),
    CONSTRAINT chk_day_of_week CHECK (digest_day_of_week BETWEEN 1 AND 7)
);

-- Workspace email branding and customization
CREATE TABLE IF NOT EXISTS workspace_email_branding (
    workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Brand Identity
    brand_name VARCHAR(255),
    brand_logo_url TEXT,
    brand_color_primary VARCHAR(7), -- Hex color
    brand_color_secondary VARCHAR(7),
    
    -- Custom Email Settings
    from_name VARCHAR(255),
    reply_to_email VARCHAR(255),
    
    -- Footer Customization
    custom_footer_html TEXT,
    custom_footer_text TEXT,
    
    -- Legal Requirements
    company_address TEXT,
    privacy_policy_url TEXT,
    terms_of_service_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email campaign management for marketing and announcements
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign Details
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- announcement, feature_update, newsletter, promotion
    description TEXT,
    
    -- Targeting
    target_audience VARCHAR(50) DEFAULT 'all_users', -- all_users, free_users, paid_users, specific_plan
    target_plan_ids UUID[],
    target_workspace_ids UUID[],
    
    -- Content
    template_code VARCHAR(100) REFERENCES email_templates(template_code),
    subject_line VARCHAR(500) NOT NULL,
    campaign_data JSONB DEFAULT '{}',
    
    -- Scheduling
    send_at TIMESTAMP,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled
    
    -- Analytics
    total_recipients INTEGER,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_campaign_type CHECK (campaign_type IN ('announcement', 'feature_update', 'newsletter', 'promotion')),
    CONSTRAINT chk_campaign_status CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status_priority ON email_queue(status, priority, send_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_workspace ON email_queue(user_id, workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_type_timestamp ON email_events(event_type, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_email_events_user_date ON email_events(user_id, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status_send_at ON email_campaigns(status, send_at);
```

---

## 🔧 **Core Email Functions**

### **1. Template Management and Rendering**

```sql
-- Function to render email template with dynamic data
CREATE OR REPLACE FUNCTION render_email_template(
    template_code_param VARCHAR(100),
    template_data_param JSONB,
    user_uuid UUID DEFAULT NULL,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    rendered_subject TEXT,
    rendered_html TEXT,
    rendered_text TEXT,
    sendgrid_template_id VARCHAR(100)
) AS $$
DECLARE
    template_record RECORD;
    user_data JSONB := '{}';
    workspace_data JSONB := '{}';
    final_data JSONB;
    subject_result TEXT;
    html_result TEXT;
    text_result TEXT;
BEGIN
    -- Get template record
    SELECT * INTO template_record
    FROM email_templates
    WHERE template_code = template_code_param AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Email template not found: %', template_code_param;
    END IF;
    
    -- Get user data if user_uuid provided
    IF user_uuid IS NOT NULL THEN
        SELECT jsonb_build_object(
            'user_name', COALESCE(u.first_name || ' ' || u.last_name, u.username),
            'user_email', u.email,
            'user_first_name', u.first_name,
            'user_last_name', u.last_name,
            'user_timezone', COALESCE(us.timezone, 'UTC'),
            'user_language', COALESCE(us.preferred_language, 'en')
        ) INTO user_data
        FROM users u
        LEFT JOIN user_settings us ON u.id = us.user_id
        WHERE u.id = user_uuid;
    END IF;
    
    -- Get workspace data if workspace_uuid provided
    IF workspace_uuid IS NOT NULL THEN
        SELECT jsonb_build_object(
            'workspace_name', w.name,
            'workspace_description', w.description,
            'workspace_slug', w.slug
        ) INTO workspace_data
        FROM workspaces w
        WHERE w.id = workspace_uuid;
    END IF;
    
    -- Merge all data
    final_data := template_data_param || user_data || workspace_data;
    
    -- Render templates (simplified - in practice would use a proper template engine)
    subject_result := template_record.subject_template;
    html_result := template_record.html_content;
    text_result := template_record.text_content;
    
    -- Basic variable substitution (in practice, use a proper template engine)
    -- This is a simplified example
    subject_result := REPLACE(subject_result, '{{user_name}}', COALESCE(final_data->>'user_name', ''));
    subject_result := REPLACE(subject_result, '{{workspace_name}}', COALESCE(final_data->>'workspace_name', ''));
    
    RETURN QUERY SELECT
        subject_result,
        html_result,
        text_result,
        template_record.sendgrid_template_id;
END;
$$ LANGUAGE plpgsql;
```

### **2. Email Queue Management**

```sql
-- Function to queue email for sending
CREATE OR REPLACE FUNCTION queue_email(
    recipient_email_param VARCHAR(255),
    template_code_param VARCHAR(100),
    template_data_param JSONB DEFAULT '{}',
    user_uuid UUID DEFAULT NULL,
    workspace_uuid UUID DEFAULT NULL,
    send_at_param TIMESTAMP DEFAULT NULL,
    priority_param INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    queue_id UUID;
    rendered_content RECORD;
    recipient_name VARCHAR(255);
BEGIN
    -- Check user email preferences if user provided
    IF user_uuid IS NOT NULL THEN
        -- Check if user has unsubscribed from this type of email
        IF EXISTS (
            SELECT 1 FROM email_preferences ep
            JOIN email_templates et ON et.template_code = template_code_param
            WHERE ep.user_id = user_uuid
            AND (
                (et.category = 'marketing' AND ep.marketing_emails = false) OR
                (et.category = 'processing' AND ep.processing_notifications = false) OR
                (et.category = 'workspace' AND ep.workspace_notifications = false) OR
                (et.category = 'billing' AND ep.billing_notifications = false) OR
                (et.category = 'ai' AND ep.ai_insights = false) OR
                ep.global_unsubscribe = true
            )
        ) THEN
            RAISE NOTICE 'User % has unsubscribed from % emails', user_uuid, template_code_param;
            RETURN NULL;
        END IF;
        
        -- Get user name for recipient
        SELECT COALESCE(first_name || ' ' || last_name, username)
        INTO recipient_name
        FROM users
        WHERE id = user_uuid;
    END IF;
    
    -- Render email template
    SELECT * INTO rendered_content
    FROM render_email_template(
        template_code_param,
        template_data_param,
        user_uuid,
        workspace_uuid
    );
    
    -- Insert into queue
    INSERT INTO email_queue (
        recipient_email,
        recipient_name,
        user_id,
        workspace_id,
        template_code,
        subject,
        sendgrid_template_id,
        template_data,
        send_at,
        priority
    ) VALUES (
        recipient_email_param,
        recipient_name,
        user_uuid,
        workspace_uuid,
        template_code_param,
        rendered_content.rendered_subject,
        rendered_content.sendgrid_template_id,
        template_data_param,
        COALESCE(send_at_param, CURRENT_TIMESTAMP),
        priority_param
    ) RETURNING id INTO queue_id;
    
    -- Create audit log
    INSERT INTO audit_logs (
        user_id,
        workspace_id,
        action,
        resource,
        resource_id,
        category,
        details
    ) VALUES (
        user_uuid,
        workspace_uuid,
        'queue_email',
        'email_queue',
        queue_id,
        'communication',
        jsonb_build_object(
            'template_code', template_code_param,
            'recipient_email', recipient_email_param,
            'priority', priority_param
        )
    );
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;
```

### **3. SendGrid Webhook Processing**

```sql
-- Function to process SendGrid webhook events
CREATE OR REPLACE FUNCTION process_sendgrid_webhook(
    webhook_data JSONB
)
RETURNS INTEGER AS $$
DECLARE
    event_record JSONB;
    processed_count INTEGER := 0;
    queue_record RECORD;
BEGIN
    -- Loop through each event in the webhook payload
    FOR event_record IN SELECT * FROM jsonb_array_elements(webhook_data)
    LOOP
        -- Find corresponding email queue record
        SELECT * INTO queue_record
        FROM email_queue
        WHERE sendgrid_message_id = event_record->>'sg_message_id';
        
        IF FOUND THEN
            -- Insert event record
            INSERT INTO email_events (
                email_queue_id,
                sendgrid_message_id,
                event_type,
                event_data,
                recipient_email,
                user_id,
                event_timestamp,
                user_agent,
                ip_address
            ) VALUES (
                queue_record.id,
                event_record->>'sg_message_id',
                event_record->>'event',
                event_record,
                event_record->>'email',
                queue_record.user_id,
                to_timestamp((event_record->>'timestamp')::bigint),
                event_record->>'useragent',
                (event_record->>'ip')::inet
            );
            
            -- Update email queue status based on event
            CASE event_record->>'event'
                WHEN 'delivered' THEN
                    UPDATE email_queue
                    SET status = 'delivered', delivered_at = to_timestamp((event_record->>'timestamp')::bigint)
                    WHERE id = queue_record.id;
                    
                WHEN 'bounce' THEN
                    UPDATE email_queue
                    SET status = 'bounced', error_message = event_record->>'reason'
                    WHERE id = queue_record.id;
                    
                WHEN 'open' THEN
                    UPDATE email_queue
                    SET opened_at = to_timestamp((event_record->>'timestamp')::bigint)
                    WHERE id = queue_record.id AND opened_at IS NULL;
                    
                WHEN 'click' THEN
                    UPDATE email_queue
                    SET clicked_at = to_timestamp((event_record->>'timestamp')::bigint)
                    WHERE id = queue_record.id AND clicked_at IS NULL;
                    
                ELSE
                    -- Handle other events as needed
                    NULL;
            END CASE;
            
            processed_count := processed_count + 1;
        END IF;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 **Integration with Existing Systems**

### **Audio Processing Pipeline Integration**

```sql
-- Trigger to send processing completion emails
CREATE OR REPLACE FUNCTION trigger_processing_completion_email()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    processing_time INTERVAL;
    template_data JSONB;
BEGIN
    -- Only send email if transcript was successfully generated
    IF NEW.transcript IS NOT NULL AND OLD.transcript IS NULL THEN
        -- Get user information
        SELECT u.*, us.processing_notifications
        INTO user_record
        FROM users u
        LEFT JOIN user_settings us ON u.id = us.user_id
        WHERE u.id = NEW.user_id;
        
        -- Only send if user hasn't disabled processing notifications
        IF user_record.processing_notifications IS NOT FALSE THEN
            -- Calculate processing time
            processing_time := NEW.updated_at - NEW.created_at;
            
            -- Prepare template data
            template_data := jsonb_build_object(
                'audio_title', COALESCE(NEW.title, 'Untitled Audio'),
                'duration_seconds', NEW.duration_seconds,
                'word_count', NEW.word_count,
                'processing_time', EXTRACT(EPOCH FROM processing_time),
                'workspace_name', (SELECT name FROM workspaces WHERE id = NEW.workspace_id),
                'transcript_preview', LEFT(NEW.transcript, 200) || CASE WHEN LENGTH(NEW.transcript) > 200 THEN '...' ELSE '' END
            );
            
            -- Queue processing completion email
            PERFORM queue_email(
                user_record.email,
                'processing_completed',
                template_data,
                NEW.user_id,
                NEW.workspace_id,
                NULL, -- Send immediately
                7 -- Medium priority
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER audio_processing_completion_email
    AFTER UPDATE OF transcript ON audio_history
    FOR EACH ROW
    EXECUTE FUNCTION trigger_processing_completion_email();
```

### **Subscription and Billing Integration**

```sql
-- Function to send subscription-related emails
CREATE OR REPLACE FUNCTION send_subscription_email(
    user_uuid UUID,
    workspace_uuid UUID,
    email_type VARCHAR(50),
    additional_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    template_code VARCHAR(100);
    template_data JSONB;
    user_subscription RECORD;
    queue_id UUID;
BEGIN
    -- Get current subscription information
    SELECT 
        sp.name as plan_name,
        sp.price,
        sp.currency,
        ws.current_period_end,
        ws.status
    INTO user_subscription
    FROM workspace_subscriptions ws
    JOIN subscription_plans sp ON ws.plan_id = sp.id
    WHERE ws.workspace_id = workspace_uuid AND ws.status = 'active';
    
    -- Determine template and prepare data based on email type
    CASE email_type
        WHEN 'trial_expiring' THEN
            template_code := 'trial_expiring_warning';
            template_data := jsonb_build_object(
                'days_remaining', additional_data->>'days_remaining',
                'trial_end_date', user_subscription.current_period_end,
                'recommended_plan', 'Creator Plan' -- Could be dynamic based on usage
            );
            
        WHEN 'payment_failed' THEN
            template_code := 'payment_failed_notification';
            template_data := jsonb_build_object(
                'plan_name', user_subscription.plan_name,
                'amount', user_subscription.price,
                'currency', user_subscription.currency,
                'retry_date', additional_data->>'retry_date'
            );
            
        WHEN 'quota_warning' THEN
            template_code := 'quota_warning_notification';
            template_data := jsonb_build_object(
                'quota_type', additional_data->>'quota_type',
                'usage_percentage', additional_data->>'usage_percentage',
                'current_usage', additional_data->>'current_usage',
                'quota_limit', additional_data->>'quota_limit',
                'reset_date', additional_data->>'reset_date'
            );
            
        ELSE
            RAISE EXCEPTION 'Unknown subscription email type: %', email_type;
    END CASE;
    
    -- Merge additional data
    template_data := template_data || additional_data;
    
    -- Queue the email
    SELECT queue_email(
        (SELECT email FROM users WHERE id = user_uuid),
        template_code,
        template_data,
        user_uuid,
        workspace_uuid,
        NULL, -- Send immediately
        8 -- High priority for billing emails
    ) INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;
```

### **Chatbot Integration**

```sql
-- Function to send AI insights digest emails
CREATE OR REPLACE FUNCTION send_ai_insights_digest(
    user_uuid UUID,
    workspace_uuid UUID,
    period_start DATE,
    period_end DATE
)
RETURNS UUID AS $$
DECLARE
    template_data JSONB;
    transcript_count INTEGER;
    top_topics TEXT[];
    recent_queries TEXT[];
    insights_data JSONB;
BEGIN
    -- Get transcript statistics for the period
    SELECT COUNT(*)
    INTO transcript_count
    FROM audio_history
    WHERE user_id = user_uuid
        AND workspace_id = workspace_uuid
        AND created_at BETWEEN period_start AND period_end + INTERVAL '1 day';
    
    -- Get recent chatbot queries (if chatbot system is implemented)
    SELECT ARRAY(
        SELECT cm.content
        FROM chatbot_messages cm
        JOIN chatbot_conversations cc ON cm.conversation_id = cc.id
        WHERE cc.user_id = user_uuid
            AND cc.workspace_id = workspace_uuid
            AND cm.message_type = 'user'
            AND cm.created_at BETWEEN period_start AND period_end + INTERVAL '1 day'
        ORDER BY cm.created_at DESC
        LIMIT 5
    ) INTO recent_queries;
    
    -- Prepare insights data
    insights_data := jsonb_build_object(
        'period_start', period_start,
        'period_end', period_end,
        'transcript_count', transcript_count,
        'recent_queries', COALESCE(recent_queries, ARRAY[]::TEXT[]),
        'workspace_name', (SELECT name FROM workspaces WHERE id = workspace_uuid)
    );
    
    -- Only send if there's meaningful content
    IF transcript_count > 0 OR array_length(recent_queries, 1) > 0 THEN
        RETURN queue_email(
            (SELECT email FROM users WHERE id = user_uuid),
            'ai_insights_digest',
            insights_data,
            user_uuid,
            workspace_uuid,
            NULL, -- Send immediately
            3 -- Lower priority for digest emails
        );
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 **Email Analytics and Reporting**

### **Email Performance Dashboard**

```sql
-- Comprehensive email analytics view
CREATE OR REPLACE VIEW email_performance_dashboard AS
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    u.id as user_id,
    u.email as user_email,
    et.category as email_category,
    et.template_code,
    
    -- Volume Metrics (Last 30 Days)
    COUNT(eq.id) as emails_sent,
    COUNT(CASE WHEN eq.status = 'delivered' THEN 1 END) as emails_delivered,
    COUNT(CASE WHEN eq.opened_at IS NOT NULL THEN 1 END) as emails_opened,
    COUNT(CASE WHEN eq.clicked_at IS NOT NULL THEN 1 END) as emails_clicked,
    COUNT(CASE WHEN eq.status = 'bounced' THEN 1 END) as emails_bounced,
    
    -- Rate Calculations
    (COUNT(CASE WHEN eq.status = 'delivered' THEN 1 END)::FLOAT / NULLIF(COUNT(eq.id), 0)) * 100 as delivery_rate,
    (COUNT(CASE WHEN eq.opened_at IS NOT NULL THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN eq.status = 'delivered' THEN 1 END), 0)) * 100 as open_rate,
    (COUNT(CASE WHEN eq.clicked_at IS NOT NULL THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN eq.opened_at IS NOT NULL THEN 1 END), 0)) * 100 as click_through_rate,
    
    -- Timing Metrics
    AVG(EXTRACT(EPOCH FROM (eq.delivered_at - eq.sent_at))) as avg_delivery_time_seconds,
    AVG(EXTRACT(EPOCH FROM (eq.opened_at - eq.delivered_at))) as avg_time_to_open_seconds,
    
    -- Recent Activity
    MAX(eq.sent_at) as last_email_sent,
    
    -- Period
    DATE_TRUNC('month', CURRENT_DATE) as period_start
    
FROM workspaces w
LEFT JOIN users u ON u.id IN (
    SELECT wu.user_id FROM workspace_users wu WHERE wu.workspace_id = w.id
)
LEFT JOIN email_queue eq ON (eq.user_id = u.id AND eq.workspace_id = w.id)
LEFT JOIN email_templates et ON eq.template_code = et.template_code
WHERE eq.created_at >= CURRENT_DATE - INTERVAL '30 days'
    OR eq.id IS NULL
GROUP BY w.id, w.name, u.id, u.email, et.category, et.template_code
ORDER BY emails_sent DESC, delivery_rate DESC;

-- Email engagement trends view
CREATE OR REPLACE VIEW email_engagement_trends AS
SELECT 
    DATE_TRUNC('week', eq.sent_at) as week_start,
    et.category,
    COUNT(eq.id) as emails_sent,
    COUNT(CASE WHEN eq.status = 'delivered' THEN 1 END) as emails_delivered,
    COUNT(CASE WHEN eq.opened_at IS NOT NULL THEN 1 END) as emails_opened,
    (COUNT(CASE WHEN eq.opened_at IS NOT NULL THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN eq.status = 'delivered' THEN 1 END), 0)) * 100 as open_rate
FROM email_queue eq
JOIN email_templates et ON eq.template_code = et.template_code
WHERE eq.sent_at >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', eq.sent_at), et.category
ORDER BY week_start DESC, et.category;
```

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Core Infrastructure (Weeks 1-2)**
1. **Deploy email database schema** - All email management tables
2. **Set up SendGrid integration** - API configuration and webhook endpoints
3. **Implement basic template system** - Core email templates and rendering
4. **Build email queue processor** - Background job for sending emails

### **Phase 2: Essential Email Types (Weeks 3-4)**
5. **Authentication emails** - Welcome, verification, password reset
6. **Processing notifications** - Upload confirmation, completion alerts
7. **Workspace management** - Invitations and role change notifications
8. **Basic billing emails** - Payment confirmations and failures

### **Phase 3: Advanced Features (Weeks 5-6)**
9. **Subscription management** - Trial warnings, quota alerts
10. **AI insights integration** - Chatbot digests and weekly summaries
11. **Campaign management** - Marketing emails and announcements
12. **Analytics dashboard** - Email performance tracking

### **Phase 4: Enterprise Features (Weeks 7-8)**
13. **Workspace branding** - Custom email templates and branding
14. **Advanced segmentation** - Targeted campaigns and user preferences
15. **A/B testing framework** - Template optimization and testing
16. **Compliance features** - GDPR compliance and unsubscribe management

---

## 📋 **Default Email Templates**

### **Essential Templates to Create**

```sql
-- Insert default email templates
INSERT INTO email_templates (template_code, template_name, description, category, subject_template, sendgrid_template_id, required_variables) VALUES

-- Authentication & Onboarding
('welcome_user', 'Welcome Email', 'Welcome new users to AudioTricks', 'auth', 'Welcome to AudioTricks, {{user_name}}!', 'd-welcome123', ARRAY['user_name']),
('email_verification', 'Email Verification', 'Verify email address for new accounts', 'auth', 'Please verify your AudioTricks account', 'd-verify123', ARRAY['user_name', 'verification_link']),
('password_reset', 'Password Reset', 'Password reset instructions', 'auth', 'Reset your AudioTricks password', 'd-reset123', ARRAY['user_name', 'reset_link']),

-- Workspace Management
('workspace_invite', 'Workspace Invitation', 'Invite users to join workspace', 'workspace', 'You''re invited to join {{workspace_name}}', 'd-invite123', ARRAY['user_name', 'workspace_name', 'invite_link']),
('role_changed', 'Role Change Notification', 'Notify when user role changes', 'workspace', 'Your role in {{workspace_name}} has been updated', 'd-role123', ARRAY['user_name', 'workspace_name', 'new_role']),

-- Processing Notifications
('processing_completed', 'Processing Complete', 'Audio processing completion notification', 'processing', 'Your audio "{{audio_title}}" is ready!', 'd-complete123', ARRAY['user_name', 'audio_title', 'transcript_preview']),
('processing_failed', 'Processing Failed', 'Audio processing failure notification', 'processing', 'Processing failed for "{{audio_title}}"', 'd-failed123', ARRAY['user_name', 'audio_title', 'error_message']),

-- Billing & Subscriptions
('trial_expiring_warning', 'Trial Expiring', 'Trial expiration warning', 'billing', 'Your AudioTricks trial expires in {{days_remaining}} days', 'd-trial123', ARRAY['user_name', 'days_remaining']),
('payment_failed_notification', 'Payment Failed', 'Payment failure notification', 'billing', 'Payment failed for your {{plan_name}} subscription', 'd-payment123', ARRAY['user_name', 'plan_name', 'amount']),
('quota_warning_notification', 'Quota Warning', 'Usage quota warning', 'billing', 'You''ve used {{usage_percentage}}% of your {{quota_type}} quota', 'd-quota123', ARRAY['user_name', 'quota_type', 'usage_percentage']),

-- AI & Insights
('ai_insights_digest', 'AI Insights Digest', 'Weekly AI insights and transcript summary', 'ai', 'Your weekly AudioTricks insights', 'd-insights123', ARRAY['user_name', 'workspace_name', 'transcript_count']);
```

---

## 🔒 **Security and Compliance**

### **Data Privacy**
- **GDPR Compliance** - Proper consent management and data retention
- **Unsubscribe Management** - One-click unsubscribe with audit trail
- **Data Encryption** - All email content encrypted in transit and at rest
- **API Key Security** - SendGrid API keys stored securely with rotation

### **Anti-Spam Measures**
- **Rate Limiting** - Prevent email abuse and maintain sender reputation
- **Content Filtering** - Automatic spam score checking before sending
- **Bounce Management** - Automatic handling of hard and soft bounces
- **Suppression Lists** - Maintain suppression lists for bounced emails

### **Audit and Monitoring**
- **Email Logs** - Complete audit trail of all email activities
- **Delivery Monitoring** - Real-time monitoring of email delivery rates
- **Performance Alerts** - Automated alerts for delivery issues
- **Compliance Reporting** - Regular reports for regulatory compliance

---

## 🎯 **Success Metrics**

### **Delivery Metrics**
- **Delivery Rate** - Target: 98%+ successful delivery
- **Open Rate** - Target: 25%+ for transactional, 15%+ for marketing
- **Click-Through Rate** - Target: 5%+ for emails with CTAs
- **Bounce Rate** - Target: <2% for all email types

### **Business Impact**
- **User Engagement** - 30% increase in platform engagement through email
- **Conversion Rate** - 15% improvement in trial-to-paid conversions
- **User Retention** - 20% improvement in user retention through notifications
- **Support Reduction** - 25% reduction in support tickets through proactive emails

### **Technical Metrics**
- **Processing Time** - Target: <5 seconds for email queue processing
- **System Uptime** - Target: 99.9% availability for email services
- **Template Performance** - A/B testing to optimize email templates
- **Error Rate** - Target: <1% email processing errors

This comprehensive SendGrid email integration will transform AudioTricks into a communication-rich platform that keeps users engaged, informed, and connected to their audio content and workspace activities.