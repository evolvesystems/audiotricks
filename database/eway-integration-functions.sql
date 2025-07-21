-- AudioTricks eWAY Payment Gateway Integration Functions
-- This file implements the core eWAY billing and subscription management system

-- =======================================================
-- EWAY INTEGRATION SCHEMA
-- =======================================================

-- eWAY customer tokens and payment methods
CREATE TABLE IF NOT EXISTS eway_customers (
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
    
    -- Constraints
    UNIQUE(user_id, eway_customer_token)
);

-- eWAY transaction records
CREATE TABLE IF NOT EXISTS eway_transactions (
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
CREATE TABLE IF NOT EXISTS eway_recurring_schedules (
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
CREATE TABLE IF NOT EXISTS eway_webhook_events (
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
CREATE INDEX IF NOT EXISTS idx_eway_customers_user_id ON eway_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_eway_customers_token ON eway_customers(eway_customer_token);
CREATE INDEX IF NOT EXISTS idx_eway_transactions_user_id ON eway_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_eway_transactions_status ON eway_transactions(transaction_status);
CREATE INDEX IF NOT EXISTS idx_eway_transactions_eway_id ON eway_transactions(eway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_eway_schedules_next_billing ON eway_recurring_schedules(next_billing_date, status);
CREATE INDEX IF NOT EXISTS idx_eway_webhooks_processed ON eway_webhook_events(processed, received_at);

-- =======================================================
-- EWAY CUSTOMER TOKEN MANAGEMENT
-- =======================================================

-- Function to create eWAY customer token
CREATE OR REPLACE FUNCTION create_eway_customer(
    user_uuid UUID,
    customer_details JSONB,
    eway_token VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
    customer_id UUID;
    existing_customer UUID;
BEGIN
    -- Check for existing active customer
    SELECT id INTO existing_customer
    FROM eway_customers
    WHERE user_id = user_uuid AND is_active = true;
    
    -- Deactivate existing customer if found
    IF existing_customer IS NOT NULL THEN
        UPDATE eway_customers
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = existing_customer;
    END IF;
    
    -- Create new customer record
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
        eway_reference,
        metadata
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
        RIGHT(customer_details->>'CardNumber', 4), -- Last 4 digits only
        customer_details->>'CardType',
        (customer_details->>'CardExpiryMonth')::INTEGER,
        (customer_details->>'CardExpiryYear')::INTEGER,
        customer_details->>'Reference',
        customer_details
    ) RETURNING id INTO customer_id;
    
    -- Create audit log
    INSERT INTO audit_logs (
        user_id,
        action,
        resource,
        resource_id,
        category,
        details,
        outcome
    ) VALUES (
        user_uuid,
        'create_eway_customer',
        'eway_customer',
        customer_id,
        'payment_method',
        jsonb_build_object(
            'eway_token', eway_token,
            'card_type', customer_details->>'CardType',
            'card_last_four', RIGHT(customer_details->>'CardNumber', 4)
        ),
        'success'
    );
    
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
    card_expiry_month INTEGER,
    card_expiry_year INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP
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
        ec.card_expiry_month,
        ec.card_expiry_year,
        ec.is_active,
        ec.created_at
    FROM eway_customers ec
    WHERE ec.user_id = user_uuid 
        AND ec.is_active = true
    ORDER BY ec.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update eWAY customer details
CREATE OR REPLACE FUNCTION update_eway_customer(
    customer_uuid UUID,
    customer_details JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    customer_exists BOOLEAN;
BEGIN
    -- Check if customer exists
    SELECT EXISTS(SELECT 1 FROM eway_customers WHERE id = customer_uuid) INTO customer_exists;
    
    IF NOT customer_exists THEN
        RETURN false;
    END IF;
    
    -- Update customer details
    UPDATE eway_customers
    SET 
        first_name = COALESCE(customer_details->>'FirstName', first_name),
        last_name = COALESCE(customer_details->>'LastName', last_name),
        email = COALESCE(customer_details->>'Email', email),
        company_name = COALESCE(customer_details->>'CompanyName', company_name),
        street_address = COALESCE(customer_details->>'Street1', street_address),
        city = COALESCE(customer_details->>'City', city),
        state = COALESCE(customer_details->>'State', state),
        postal_code = COALESCE(customer_details->>'PostalCode', postal_code),
        card_last_four = COALESCE(RIGHT(customer_details->>'CardNumber', 4), card_last_four),
        card_type = COALESCE(customer_details->>'CardType', card_type),
        card_expiry_month = COALESCE((customer_details->>'CardExpiryMonth')::INTEGER, card_expiry_month),
        card_expiry_year = COALESCE((customer_details->>'CardExpiryYear')::INTEGER, card_expiry_year),
        metadata = metadata || customer_details,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = customer_uuid;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- PAYMENT PROCESSING FUNCTIONS
-- =======================================================

-- Function to process one-time payment
CREATE OR REPLACE FUNCTION process_eway_payment(
    user_uuid UUID,
    amount_val DECIMAL(10,2),
    currency_val VARCHAR(3) DEFAULT 'AUD',
    transaction_type_val VARCHAR(50) DEFAULT 'purchase',
    subscription_id_val UUID DEFAULT NULL,
    workspace_id_val UUID DEFAULT NULL,
    billing_period_start_val DATE DEFAULT NULL,
    billing_period_end_val DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
    eway_customer RECORD;
    invoice_number VARCHAR(255);
BEGIN
    -- Get eWAY customer
    SELECT * INTO eway_customer FROM get_eway_customer(user_uuid);
    
    IF eway_customer.customer_id IS NULL THEN
        RAISE EXCEPTION 'No active eWAY customer found for user %', user_uuid;
    END IF;
    
    -- Generate invoice number
    invoice_number := 'AT-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || 
                     UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
    
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
        is_recurring,
        billing_period_start,
        billing_period_end,
        eway_invoice_number,
        eway_invoice_reference
    ) VALUES (
        user_uuid,
        workspace_id_val,
        eway_customer.customer_id,
        subscription_id_val,
        transaction_type_val,
        amount_val,
        currency_val,
        'pending',
        transaction_type_val = 'recurring',
        billing_period_start_val,
        billing_period_end_val,
        invoice_number,
        'AudioTricks Subscription Payment'
    ) RETURNING id INTO transaction_id;
    
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
        user_uuid,
        workspace_id_val,
        'create_payment',
        'eway_transaction',
        transaction_id,
        'billing',
        jsonb_build_object(
            'amount', amount_val,
            'currency', currency_val,
            'transaction_type', transaction_type_val,
            'invoice_number', invoice_number,
            'subscription_id', subscription_id_val
        ),
        'pending'
    );
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update transaction status
CREATE OR REPLACE FUNCTION update_eway_transaction_status(
    transaction_uuid UUID,
    eway_transaction_id_val BIGINT,
    status_val VARCHAR(50),
    response_details JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    transaction_record RECORD;
    subscription_updated BOOLEAN := false;
BEGIN
    -- Get transaction details
    SELECT * INTO transaction_record
    FROM eway_transactions
    WHERE id = transaction_uuid;
    
    IF transaction_record.id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update transaction
    UPDATE eway_transactions
    SET 
        eway_transaction_id = eway_transaction_id_val,
        transaction_status = status_val,
        eway_auth_code = response_details->>'AuthorisationCode',
        response_code = response_details->>'ResponseCode',
        response_message = response_details->>'ResponseMessage',
        fraud_action = response_details->>'FraudAction',
        verification_status = response_details->>'VerificationStatus',
        beagle_score = (response_details->>'BeagleScore')::DECIMAL,
        processed_at = CURRENT_TIMESTAMP,
        eway_raw_response = response_details,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = transaction_uuid;
    
    -- Handle successful payment
    IF status_val = 'approved' AND transaction_record.subscription_id IS NOT NULL THEN
        -- Update user subscription
        IF transaction_record.workspace_id IS NULL THEN
            UPDATE user_subscriptions
            SET 
                status = 'active',
                current_period_start = COALESCE(transaction_record.billing_period_start, CURRENT_DATE),
                current_period_end = COALESCE(transaction_record.billing_period_end, CURRENT_DATE + INTERVAL '1 month'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = transaction_record.subscription_id;
            subscription_updated := true;
        ELSE
            -- Update workspace subscription
            UPDATE workspace_subscriptions
            SET 
                status = 'active',
                current_period_start = COALESCE(transaction_record.billing_period_start, CURRENT_DATE),
                current_period_end = COALESCE(transaction_record.billing_period_end, CURRENT_DATE + INTERVAL '1 month'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = transaction_record.subscription_id;
            subscription_updated := true;
        END IF;
        
        -- Update recurring schedule if applicable
        IF transaction_record.is_recurring THEN
            UPDATE eway_recurring_schedules
            SET 
                status = 'active',
                failed_attempts = 0,
                last_processed_at = CURRENT_TIMESTAMP,
                last_transaction_id = transaction_uuid
            WHERE subscription_id = transaction_record.subscription_id;
        END IF;
    END IF;
    
    -- Handle failed payment
    IF status_val IN ('declined', 'failed') AND transaction_record.is_recurring THEN
        UPDATE eway_recurring_schedules
        SET 
            failed_attempts = failed_attempts + 1,
            status = CASE 
                WHEN failed_attempts + 1 >= max_failed_attempts THEN 'failed'
                ELSE status
            END,
            next_billing_date = CASE 
                WHEN failed_attempts + 1 < max_failed_attempts THEN next_billing_date + INTERVAL '1 day' * retry_interval_days
                ELSE next_billing_date
            END
        WHERE subscription_id = transaction_record.subscription_id;
    END IF;
    
    -- Update audit log
    UPDATE audit_logs
    SET 
        outcome = status_val,
        details = details || jsonb_build_object(
            'eway_transaction_id', eway_transaction_id_val,
            'response_code', response_details->>'ResponseCode',
            'auth_code', response_details->>'AuthorisationCode',
            'subscription_updated', subscription_updated
        )
    WHERE resource = 'eway_transaction' 
        AND resource_id = transaction_uuid 
        AND action = 'create_payment';
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- RECURRING BILLING MANAGEMENT
-- =======================================================

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
    existing_schedule UUID;
BEGIN
    -- Get eWAY customer
    SELECT * INTO eway_customer FROM get_eway_customer(user_uuid);
    
    IF eway_customer.customer_id IS NULL THEN
        RAISE EXCEPTION 'No active eWAY customer found for user %', user_uuid;
    END IF;
    
    -- Check for existing active schedule
    SELECT id INTO existing_schedule
    FROM eway_recurring_schedules
    WHERE subscription_id = subscription_id_val 
        AND status = 'active';
    
    -- Cancel existing schedule if found
    IF existing_schedule IS NOT NULL THEN
        UPDATE eway_recurring_schedules
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
        WHERE id = existing_schedule;
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
        user_uuid,
        workspace_id_val,
        'create_recurring_schedule',
        'eway_recurring_schedule',
        schedule_id,
        'billing',
        jsonb_build_object(
            'subscription_id', subscription_id_val,
            'billing_amount', billing_amount,
            'schedule_type', schedule_type_val,
            'start_date', start_date_val,
            'next_billing_date', next_billing
        ),
        'success'
    );
    
    RETURN schedule_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process due recurring payments
CREATE OR REPLACE FUNCTION process_due_recurring_payments()
RETURNS INTEGER AS $$
DECLARE
    schedule_record RECORD;
    processed_count INTEGER := 0;
    transaction_id UUID;
    billing_start DATE;
    billing_end DATE;
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
        -- Calculate billing period
        billing_start := schedule_record.next_billing_date;
        billing_end := CASE schedule_record.schedule_type
            WHEN 'monthly' THEN billing_start + INTERVAL '1 month' - INTERVAL '1 day'
            WHEN 'yearly' THEN billing_start + INTERVAL '1 year' - INTERVAL '1 day'
            ELSE billing_start + INTERVAL '1 month' - INTERVAL '1 day'
        END;
        
        -- Create transaction for this billing cycle
        transaction_id := process_eway_payment(
            schedule_record.user_id,
            schedule_record.billing_amount,
            schedule_record.currency,
            'recurring',
            schedule_record.subscription_id,
            schedule_record.workspace_id,
            billing_start,
            billing_end
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
        
        -- Create audit log for billing attempt
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
            schedule_record.user_id,
            schedule_record.workspace_id,
            'process_recurring_billing',
            'eway_recurring_schedule',
            schedule_record.id,
            'billing',
            jsonb_build_object(
                'billing_amount', schedule_record.billing_amount,
                'billing_period_start', billing_start,
                'billing_period_end', billing_end,
                'transaction_id', transaction_id
            ),
            'pending'
        );
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel recurring schedule
CREATE OR REPLACE FUNCTION cancel_eway_recurring_schedule(
    schedule_uuid UUID,
    cancellation_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    schedule_record RECORD;
BEGIN
    -- Get schedule details
    SELECT * INTO schedule_record
    FROM eway_recurring_schedules
    WHERE id = schedule_uuid AND status = 'active';
    
    IF schedule_record.id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Cancel the schedule
    UPDATE eway_recurring_schedules
    SET 
        status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        metadata = metadata || jsonb_build_object(
            'cancellation_reason', cancellation_reason,
            'cancelled_by_user', true
        )
    WHERE id = schedule_uuid;
    
    -- Update associated subscription
    IF schedule_record.workspace_id IS NULL THEN
        UPDATE user_subscriptions
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
        WHERE id = schedule_record.subscription_id;
    ELSE
        UPDATE workspace_subscriptions
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
        WHERE id = schedule_record.subscription_id;
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
        schedule_record.user_id,
        schedule_record.workspace_id,
        'cancel_recurring_schedule',
        'eway_recurring_schedule',
        schedule_uuid,
        'billing',
        jsonb_build_object(
            'subscription_id', schedule_record.subscription_id,
            'cancellation_reason', cancellation_reason,
            'billing_amount', schedule_record.billing_amount
        ),
        'success'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- WEBHOOK PROCESSING
-- =======================================================

-- Function to process eWAY webhook events
CREATE OR REPLACE FUNCTION process_eway_webhook(
    event_type_val VARCHAR(100),
    event_data_val JSONB,
    raw_payload_val TEXT,
    source_ip_val INET DEFAULT NULL,
    request_headers JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    webhook_id UUID;
    transaction_id BIGINT;
    customer_token VARCHAR(20);
    processing_success BOOLEAN := true;
    error_message TEXT := NULL;
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
        source_ip,
        headers
    ) VALUES (
        event_type_val,
        transaction_id,
        customer_token,
        event_data_val,
        raw_payload_val,
        source_ip_val,
        request_headers
    ) RETURNING id INTO webhook_id;
    
    -- Process specific event types
    BEGIN
        CASE event_type_val
            WHEN 'Payment.Successful' THEN
                PERFORM handle_successful_payment(transaction_id, event_data_val);
            WHEN 'Payment.Failed' THEN
                PERFORM handle_failed_payment(transaction_id, event_data_val);
            WHEN 'Customer.Updated' THEN
                PERFORM handle_customer_update(customer_token, event_data_val);
            WHEN 'Payment.Refunded' THEN
                PERFORM handle_payment_refund(transaction_id, event_data_val);
            ELSE
                -- Log unknown event type but don't fail
                error_message := format('Unknown webhook event type: %s', event_type_val);
        END CASE;
    EXCEPTION WHEN OTHERS THEN
        processing_success := false;
        error_message := SQLERRM;
    END;
    
    -- Mark webhook as processed or failed
    UPDATE eway_webhook_events 
    SET 
        processed = processing_success,
        processed_at = CURRENT_TIMESTAMP,
        processing_error = error_message,
        processing_attempts = processing_attempts + 1
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
BEGIN
    -- Find matching transaction
    SELECT * INTO transaction_record
    FROM eway_transactions
    WHERE eway_transaction_id = eway_transaction_id_val
       OR (eway_access_code = event_data->>'AccessCode' AND eway_transaction_id IS NULL);
    
    IF transaction_record.id IS NULL THEN
        RAISE EXCEPTION 'Transaction not found for eWAY ID %', eway_transaction_id_val;
    END IF;
    
    -- Update transaction status
    PERFORM update_eway_transaction_status(
        transaction_record.id,
        eway_transaction_id_val,
        'approved',
        event_data
    );
    
    -- Update customer last used timestamp
    UPDATE eway_customers
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE id = transaction_record.eway_customer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle failed payments
CREATE OR REPLACE FUNCTION handle_failed_payment(
    eway_transaction_id_val BIGINT,
    event_data JSONB
)
RETURNS VOID AS $$
DECLARE
    transaction_record RECORD;
BEGIN
    -- Find matching transaction
    SELECT * INTO transaction_record
    FROM eway_transactions
    WHERE eway_transaction_id = eway_transaction_id_val
       OR (eway_access_code = event_data->>'AccessCode' AND eway_transaction_id IS NULL);
    
    IF transaction_record.id IS NULL THEN
        RAISE EXCEPTION 'Transaction not found for eWAY ID %', eway_transaction_id_val;
    END IF;
    
    -- Update transaction status
    PERFORM update_eway_transaction_status(
        transaction_record.id,
        eway_transaction_id_val,
        'declined',
        event_data
    );
END;
$$ LANGUAGE plpgsql;

-- Function to handle customer updates
CREATE OR REPLACE FUNCTION handle_customer_update(
    customer_token_val VARCHAR(20),
    event_data JSONB
)
RETURNS VOID AS $$
DECLARE
    customer_id UUID;
BEGIN
    -- Find customer by token
    SELECT id INTO customer_id
    FROM eway_customers
    WHERE eway_customer_token = customer_token_val;
    
    IF customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer not found for token %', customer_token_val;
    END IF;
    
    -- Update customer details
    PERFORM update_eway_customer(customer_id, event_data);
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- MONITORING AND ANALYTICS VIEWS
-- =======================================================

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
    (COUNT(CASE WHEN et.transaction_status = 'approved' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0)) * 100 as success_rate
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

-- Customer payment method overview
CREATE OR REPLACE VIEW eway_customer_overview AS
SELECT 
    ec.id,
    ec.user_id,
    u.username,
    u.email as user_email,
    ec.first_name,
    ec.last_name,
    ec.email as billing_email,
    ec.card_type,
    ec.card_last_four,
    ec.card_expiry_month,
    ec.card_expiry_year,
    ec.is_active,
    ec.created_at,
    ec.last_used_at,
    
    -- Payment statistics
    (SELECT COUNT(*) FROM eway_transactions et WHERE et.eway_customer_id = ec.id) as total_transactions,
    (SELECT COUNT(*) FROM eway_transactions et WHERE et.eway_customer_id = ec.id AND et.transaction_status = 'approved') as successful_transactions,
    (SELECT SUM(et.amount) FROM eway_transactions et WHERE et.eway_customer_id = ec.id AND et.transaction_status = 'approved') as total_paid,
    (SELECT COUNT(*) FROM eway_recurring_schedules ers WHERE ers.eway_customer_id = ec.id AND ers.status = 'active') as active_subscriptions
    
FROM eway_customers ec
JOIN users u ON ec.user_id = u.id
WHERE ec.is_active = true
ORDER BY ec.created_at DESC;

RAISE NOTICE 'eWAY payment gateway integration installed successfully!';
RAISE NOTICE 'Key features:';
RAISE NOTICE '- create_eway_customer() - Customer token management';
RAISE NOTICE '- process_eway_payment() - One-time and recurring payment processing';
RAISE NOTICE '- create_eway_recurring_schedule() - Subscription billing schedules';
RAISE NOTICE '- process_due_recurring_payments() - Automated billing processor';
RAISE NOTICE '- process_eway_webhook() - Webhook event processing';
RAISE NOTICE '- update_eway_transaction_status() - Transaction status management';
RAISE NOTICE '- eway_payment_analytics view - Payment insights and metrics';
RAISE NOTICE '- eway_recurring_health view - Subscription billing health';
RAISE NOTICE '- eway_customer_overview view - Customer payment method overview';