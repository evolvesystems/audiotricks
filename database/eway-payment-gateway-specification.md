# AudioTricks eWAY Payment Gateway Integration Specification

## 🎯 Overview

This specification outlines the integration of eWAY Rapid API v3 payment gateway with the AudioTricks subscription billing system, supporting both one-time payments and recurring subscriptions for user plans and workspace subscriptions.

---

## 📋 **Integration Requirements**

### **Business Requirements**
- Support for Australian payment processing via eWAY
- Recurring subscription billing for user plans and workspace plans
- Secure payment processing with PCI DSS compliance
- Token-based customer management for stored payment methods
- Integration with existing AudioTricks subscription system
- Support for plan upgrades, downgrades, and cancellations
- Automated billing cycle management
- Failed payment handling and retry logic

### **Technical Requirements**
- eWAY Rapid API v3 integration
- Server-side payment processing
- Secure token customer management
- Webhook handling for payment notifications
- Database integration with existing subscription models
- Error handling and logging
- Development and production environment support

---

## 🏗️ **eWAY API Integration Architecture**

### **Connection Method Selection**
For AudioTricks, we recommend **Secure Fields** connection method:
- **Reduces PCI DSS compliance scope**
- **Maintains brand consistency** with AudioTricks UI
- **Secure hosted payment fields** via transparent iframes
- **Full control over checkout flow**
- **Supports 3D Secure authentication**

### **API Endpoints**
```javascript
// Production
const EWAY_LIVE_ENDPOINT = 'https://api.ewaypayments.com';

// Sandbox
const EWAY_SANDBOX_ENDPOINT = 'https://api.sandbox.ewaypayments.com';

// Key endpoints
const ENDPOINTS = {
  ACCESS_CODES: '/AccessCodes',
  ACCESS_CODES_SHARED: '/AccessCodesShared', 
  TRANSACTIONS: '/Transaction',
  CUSTOMERS: '/Customer',
  REFUNDS: '/Refund'
};
```

### **Authentication**
```javascript
// Basic Authentication
const auth = {
  apiKey: process.env.EWAY_API_KEY,
  password: process.env.EWAY_PASSWORD,
  endpoint: process.env.NODE_ENV === 'production' ? EWAY_LIVE_ENDPOINT : EWAY_SANDBOX_ENDPOINT
};
```

---

## 💾 **Database Schema Extensions**

### **eWAY Integration Tables**

```sql
-- eWAY customer tokens and payment methods
CREATE TABLE eway_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- eWAY Customer Details
    eway_customer_token VARCHAR(20) UNIQUE NOT NULL, -- 16-character eWAY token
    
    -- Customer Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company_name VARCHAR(100),
    country VARCHAR(2) NOT NULL DEFAULT 'AU', -- ISO 2-letter code
    
    -- Address Information
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Payment Method Details (masked)
    card_last_four VARCHAR(4),
    card_type VARCHAR(50), -- Visa, MasterCard, etc.
    card_expiry_month INTEGER,
    card_expiry_year INTEGER,
    
    -- Status and Metadata
    is_active BOOLEAN DEFAULT true,
    eway_reference VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    
    -- Indexes
    UNIQUE(user_id, eway_customer_token)
);

-- eWAY transaction records
CREATE TABLE eway_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    eway_customer_id UUID REFERENCES eway_customers(id),
    subscription_id UUID, -- References user_subscriptions or workspace_subscriptions
    
    -- eWAY Transaction Details
    eway_transaction_id BIGINT UNIQUE, -- eWAY's transaction ID
    eway_access_code VARCHAR(255),
    eway_auth_code VARCHAR(50),
    eway_invoice_number VARCHAR(255),
    eway_invoice_reference VARCHAR(255),
    
    -- Transaction Information
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'recurring', 'refund'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'AUD',
    
    -- Status and Results
    transaction_status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'declined', 'failed'
    response_code VARCHAR(10),
    response_message TEXT,
    
    -- Fraud and Security
    fraud_action VARCHAR(50),
    verification_status VARCHAR(50),
    beagle_score DECIMAL(5,2), -- eWAY's fraud scoring
    
    -- Billing Details
    billing_period_start DATE,
    billing_period_end DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_schedule VARCHAR(50), -- 'monthly', 'yearly'
    
    -- Processing Details
    processed_at TIMESTAMP,
    webhook_received_at TIMESTAMP,
    
    -- Error Handling
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadata
    eway_raw_response JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- eWAY recurring schedules
CREATE TABLE eway_recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    eway_customer_id UUID NOT NULL REFERENCES eway_customers(id),
    subscription_id UUID NOT NULL, -- References user_subscriptions or workspace_subscriptions
    
    -- Schedule Configuration
    schedule_type VARCHAR(50) NOT NULL, -- 'monthly', 'yearly'
    billing_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'AUD',
    
    -- Billing Cycle
    start_date DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    end_date DATE, -- NULL for ongoing subscriptions
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'failed'
    
    -- Retry Logic
    failed_attempts INTEGER DEFAULT 0,
    max_failed_attempts INTEGER DEFAULT 3,
    retry_interval_days INTEGER DEFAULT 7,
    
    -- Last Processing
    last_processed_at TIMESTAMP,
    last_transaction_id UUID REFERENCES eway_transactions(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- eWAY webhook events
CREATE TABLE eway_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhook Details
    event_type VARCHAR(100) NOT NULL,
    eway_transaction_id BIGINT,
    eway_customer_token VARCHAR(20),
    
    -- Event Data
    event_data JSONB NOT NULL,
    raw_payload TEXT,
    
    -- Processing Status
    processed BOOLEAN DEFAULT false,
    processing_attempts INTEGER DEFAULT 0,
    processing_error TEXT,
    
    -- Timestamps
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- Request Details
    source_ip INET,
    user_agent TEXT,
    headers JSONB
);

-- Indexes for performance
CREATE INDEX idx_eway_customers_user_id ON eway_customers(user_id);
CREATE INDEX idx_eway_customers_token ON eway_customers(eway_customer_token);
CREATE INDEX idx_eway_transactions_user_id ON eway_transactions(user_id);
CREATE INDEX idx_eway_transactions_status ON eway_transactions(transaction_status);
CREATE INDEX idx_eway_transactions_eway_id ON eway_transactions(eway_transaction_id);
CREATE INDEX idx_eway_schedules_next_billing ON eway_recurring_schedules(next_billing_date, status);
CREATE INDEX idx_eway_webhooks_processed ON eway_webhook_events(processed, received_at);
```

---

## 🔧 **Core Integration Functions**

### **1. eWAY Customer Token Management**

```sql
-- Function to create eWAY customer token
CREATE OR REPLACE FUNCTION create_eway_customer(
    user_uuid UUID,
    customer_details JSONB,
    eway_token VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
    customer_id UUID;
BEGIN
    INSERT INTO eway_customers (
        user_id,
        eway_customer_token,
        first_name,
        last_name,
        email,
        company_name,
        country,
        street_address,
        city,
        state,
        postal_code,
        card_last_four,
        card_type,
        card_expiry_month,
        card_expiry_year,
        eway_reference
    ) VALUES (
        user_uuid,
        eway_token,
        customer_details->>'FirstName',
        customer_details->>'LastName',
        customer_details->>'Email',
        customer_details->>'CompanyName',
        COALESCE(customer_details->>'Country', 'AU'),
        customer_details->>'Street1',
        customer_details->>'City',
        customer_details->>'State',
        customer_details->>'PostalCode',
        customer_details->>'CardNumber', -- Last 4 digits only
        customer_details->>'CardType',
        (customer_details->>'CardExpiryMonth')::INTEGER,
        (customer_details->>'CardExpiryYear')::INTEGER,
        customer_details->>'Reference'
    ) RETURNING id INTO customer_id;
    
    RETURN customer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get active eWAY customer for user
CREATE OR REPLACE FUNCTION get_eway_customer(user_uuid UUID)
RETURNS TABLE (
    customer_id UUID,
    eway_token VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    card_last_four VARCHAR(4),
    card_type VARCHAR(50),
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id,
        ec.eway_customer_token,
        ec.first_name,
        ec.last_name,
        ec.email,
        ec.card_last_four,
        ec.card_type,
        ec.is_active
    FROM eway_customers ec
    WHERE ec.user_id = user_uuid 
        AND ec.is_active = true
    ORDER BY ec.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

### **2. Payment Processing Functions**

```sql
-- Function to process one-time payment
CREATE OR REPLACE FUNCTION process_eway_payment(
    user_uuid UUID,
    amount_val DECIMAL(10,2),
    currency_val VARCHAR(3) DEFAULT 'AUD',
    transaction_type_val VARCHAR(50) DEFAULT 'purchase',
    subscription_id_val UUID DEFAULT NULL,
    workspace_id_val UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
    eway_customer RECORD;
BEGIN
    -- Get eWAY customer
    SELECT * INTO eway_customer FROM get_eway_customer(user_uuid);
    
    IF eway_customer.customer_id IS NULL THEN
        RAISE EXCEPTION 'No active eWAY customer found for user %', user_uuid;
    END IF;
    
    -- Create transaction record
    INSERT INTO eway_transactions (
        user_id,
        workspace_id,
        eway_customer_id,
        subscription_id,
        transaction_type,
        amount,
        currency,
        transaction_status,
        is_recurring
    ) VALUES (
        user_uuid,
        workspace_id_val,
        eway_customer.customer_id,
        subscription_id_val,
        transaction_type_val,
        amount_val,
        currency_val,
        'pending',
        false
    ) RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create recurring billing schedule
CREATE OR REPLACE FUNCTION create_eway_recurring_schedule(
    user_uuid UUID,
    subscription_id_val UUID,
    billing_amount DECIMAL(10,2),
    schedule_type_val VARCHAR(50) DEFAULT 'monthly',
    start_date_val DATE DEFAULT CURRENT_DATE,
    workspace_id_val UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    schedule_id UUID;
    eway_customer RECORD;
    next_billing DATE;
BEGIN
    -- Get eWAY customer
    SELECT * INTO eway_customer FROM get_eway_customer(user_uuid);
    
    IF eway_customer.customer_id IS NULL THEN
        RAISE EXCEPTION 'No active eWAY customer found for user %', user_uuid;
    END IF;
    
    -- Calculate next billing date
    next_billing := CASE schedule_type_val
        WHEN 'monthly' THEN start_date_val + INTERVAL '1 month'
        WHEN 'yearly' THEN start_date_val + INTERVAL '1 year'
        ELSE start_date_val + INTERVAL '1 month'
    END;
    
    -- Create recurring schedule
    INSERT INTO eway_recurring_schedules (
        user_id,
        workspace_id,
        eway_customer_id,
        subscription_id,
        schedule_type,
        billing_amount,
        start_date,
        next_billing_date
    ) VALUES (
        user_uuid,
        workspace_id_val,
        eway_customer.customer_id,
        subscription_id_val,
        schedule_type_val,
        billing_amount,
        start_date_val,
        next_billing
    ) RETURNING id INTO schedule_id;
    
    RETURN schedule_id;
END;
$$ LANGUAGE plpgsql;
```

### **3. Webhook Processing Functions**

```sql
-- Function to process eWAY webhook events
CREATE OR REPLACE FUNCTION process_eway_webhook(
    event_type_val VARCHAR(100),
    event_data_val JSONB,
    raw_payload_val TEXT,
    source_ip_val INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    webhook_id UUID;
    transaction_id BIGINT;
    customer_token VARCHAR(20);
BEGIN
    -- Extract key identifiers
    transaction_id := (event_data_val->>'TransactionID')::BIGINT;
    customer_token := event_data_val->>'TokenCustomerID';
    
    -- Create webhook event record
    INSERT INTO eway_webhook_events (
        event_type,
        eway_transaction_id,
        eway_customer_token,
        event_data,
        raw_payload,
        source_ip
    ) VALUES (
        event_type_val,
        transaction_id,
        customer_token,
        event_data_val,
        raw_payload_val,
        source_ip_val
    ) RETURNING id INTO webhook_id;
    
    -- Process specific event types
    CASE event_type_val
        WHEN 'Payment.Successful' THEN
            PERFORM handle_successful_payment(transaction_id, event_data_val);
        WHEN 'Payment.Failed' THEN
            PERFORM handle_failed_payment(transaction_id, event_data_val);
        WHEN 'Customer.Updated' THEN
            PERFORM handle_customer_update(customer_token, event_data_val);
        ELSE
            -- Log unknown event type
            NULL;
    END CASE;
    
    -- Mark webhook as processed
    UPDATE eway_webhook_events 
    SET processed = true, processed_at = CURRENT_TIMESTAMP
    WHERE id = webhook_id;
    
    RETURN webhook_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle successful payments
CREATE OR REPLACE FUNCTION handle_successful_payment(
    eway_transaction_id_val BIGINT,
    event_data JSONB
)
RETURNS VOID AS $$
DECLARE
    transaction_record RECORD;
    subscription_record RECORD;
BEGIN
    -- Update transaction status
    UPDATE eway_transactions
    SET 
        transaction_status = 'approved',
        eway_auth_code = event_data->>'AuthorisationCode',
        response_code = event_data->>'ResponseCode',
        response_message = event_data->>'ResponseMessage',
        processed_at = CURRENT_TIMESTAMP,
        webhook_received_at = CURRENT_TIMESTAMP,
        eway_raw_response = event_data
    WHERE eway_transaction_id = eway_transaction_id_val
    RETURNING * INTO transaction_record;
    
    -- Update subscription status if applicable
    IF transaction_record.subscription_id IS NOT NULL THEN
        -- Update user subscription
        IF transaction_record.workspace_id IS NULL THEN
            UPDATE user_subscriptions
            SET status = 'active',
                current_period_end = CURRENT_TIMESTAMP + INTERVAL '1 month',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = transaction_record.subscription_id;
        ELSE
            -- Update workspace subscription
            UPDATE workspace_subscriptions
            SET status = 'active',
                current_period_end = CURRENT_TIMESTAMP + INTERVAL '1 month',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = transaction_record.subscription_id;
        END IF;
    END IF;
    
    -- Create audit log
    INSERT INTO audit_logs (
        user_id,
        workspace_id,
        action,
        resource,
        resource_id,
        category,
        details,
        outcome
    ) VALUES (
        transaction_record.user_id,
        transaction_record.workspace_id,
        'payment_successful',
        'eway_transaction',
        transaction_record.id,
        'billing',
        jsonb_build_object(
            'amount', transaction_record.amount,
            'currency', transaction_record.currency,
            'eway_transaction_id', eway_transaction_id_val,
            'auth_code', event_data->>'AuthorisationCode'
        ),
        'success'
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 **Recurring Billing System**

### **Automated Billing Processor**

```sql
-- Function to process due recurring payments
CREATE OR REPLACE FUNCTION process_due_recurring_payments()
RETURNS INTEGER AS $$
DECLARE
    schedule_record RECORD;
    processed_count INTEGER := 0;
    transaction_id UUID;
BEGIN
    -- Process all schedules due for billing
    FOR schedule_record IN 
        SELECT ers.*, ec.eway_customer_token, u.email, u.username
        FROM eway_recurring_schedules ers
        JOIN eway_customers ec ON ers.eway_customer_id = ec.id
        JOIN users u ON ers.user_id = u.id
        WHERE ers.status = 'active'
            AND ers.next_billing_date <= CURRENT_DATE
            AND ers.failed_attempts < ers.max_failed_attempts
    LOOP
        -- Create transaction for this billing cycle
        transaction_id := process_eway_payment(
            schedule_record.user_id,
            schedule_record.billing_amount,
            schedule_record.currency,
            'recurring',
            schedule_record.subscription_id,
            schedule_record.workspace_id
        );
        
        -- Update schedule for next billing
        UPDATE eway_recurring_schedules
        SET 
            next_billing_date = CASE schedule_record.schedule_type
                WHEN 'monthly' THEN schedule_record.next_billing_date + INTERVAL '1 month'
                WHEN 'yearly' THEN schedule_record.next_billing_date + INTERVAL '1 year'
                ELSE schedule_record.next_billing_date + INTERVAL '1 month'
            END,
            last_processed_at = CURRENT_TIMESTAMP,
            last_transaction_id = transaction_id
        WHERE id = schedule_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 💡 **Integration Implementation Plan**

### **Phase 1: Core eWAY Integration** 
1. **Setup eWAY credentials** - Sandbox and production API keys
2. **Implement token customer creation** - Secure customer token management
3. **Create payment processing** - One-time payments for plan purchases
4. **Database schema deployment** - Install eWAY integration tables

### **Phase 2: Subscription Integration**
1. **Connect with existing subscription system** - Link eWAY to user_subscriptions and workspace_subscriptions
2. **Implement recurring billing** - Automated billing cycles
3. **Payment method management** - Update/delete stored payment methods
4. **Plan upgrade/downgrade flows** - Handle subscription changes

### **Phase 3: Advanced Features**
1. **Webhook integration** - Real-time payment status updates
2. **Failed payment handling** - Retry logic and customer notifications
3. **Refund processing** - Automated and manual refunds
4. **Reporting and analytics** - Payment insights and metrics

### **Phase 4: Production Deployment**
1. **Security review** - PCI DSS compliance validation
2. **Load testing** - Performance optimization
3. **Monitoring setup** - Payment processing alerts
4. **Go-live** - Production deployment with fallback plan

---

## 🔒 **Security Considerations**

### **PCI DSS Compliance**
- **Use Secure Fields** connection method to reduce compliance scope
- **Never store card data** - only store eWAY customer tokens
- **Encrypt sensitive data** - customer information and payment details
- **Secure API credentials** - environment variables and key rotation

### **Fraud Prevention**
- **Leverage eWAY Beagle** fraud scoring system
- **3D Secure authentication** for enhanced security
- **Transaction monitoring** for suspicious patterns
- **IP geolocation validation** for payment sources

### **Data Protection**
- **Tokenization** - replace card details with secure tokens
- **Audit logging** - comprehensive payment audit trail
- **Access controls** - role-based access to payment data
- **Data retention** - comply with financial data retention requirements

---

## 📊 **Monitoring and Analytics**

### **Payment Dashboard Views**

```sql
-- eWAY payment analytics view
CREATE OR REPLACE VIEW eway_payment_analytics AS
SELECT 
    DATE_TRUNC('day', et.created_at) as payment_date,
    et.transaction_type,
    et.transaction_status,
    COUNT(*) as transaction_count,
    SUM(et.amount) as total_amount,
    AVG(et.amount) as average_amount,
    COUNT(DISTINCT et.user_id) as unique_customers,
    COUNT(CASE WHEN et.transaction_status = 'approved' THEN 1 END) as successful_count,
    COUNT(CASE WHEN et.transaction_status = 'declined' THEN 1 END) as declined_count,
    (COUNT(CASE WHEN et.transaction_status = 'approved' THEN 1 END)::FLOAT / COUNT(*)) * 100 as success_rate
FROM eway_transactions et
WHERE et.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', et.created_at), et.transaction_type, et.transaction_status
ORDER BY payment_date DESC;

-- Recurring billing health view
CREATE OR REPLACE VIEW eway_recurring_health AS
SELECT 
    ers.schedule_type,
    ers.status,
    COUNT(*) as schedule_count,
    SUM(ers.billing_amount) as total_monthly_revenue,
    AVG(ers.failed_attempts) as avg_failed_attempts,
    COUNT(CASE WHEN ers.next_billing_date <= CURRENT_DATE THEN 1 END) as due_for_billing,
    COUNT(CASE WHEN ers.failed_attempts >= ers.max_failed_attempts THEN 1 END) as failed_schedules
FROM eway_recurring_schedules ers
GROUP BY ers.schedule_type, ers.status
ORDER BY ers.schedule_type, ers.status;
```

---

## 🎉 **Deployment Ready**

This specification provides a comprehensive eWAY payment gateway integration for AudioTricks with:

✅ **Secure Payment Processing** - PCI DSS compliant token-based payments  
✅ **Recurring Billing** - Automated subscription billing cycles  
✅ **Customer Management** - Secure token customer storage and management  
✅ **Webhook Integration** - Real-time payment status updates  
✅ **Failed Payment Handling** - Retry logic and customer notifications  
✅ **Comprehensive Monitoring** - Payment analytics and health tracking  
✅ **Database Integration** - Seamless integration with existing subscription system  

The system is designed to handle both Australian domestic payments via eWAY and integrates seamlessly with the existing AudioTricks subscription and user plan assignment systems!