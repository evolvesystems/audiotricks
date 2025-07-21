# AudioTricks Subscription & Billing Management Specification

## 💳 Overview

This specification defines the comprehensive subscription and billing management system for AudioTricks, supporting multiple pricing tiers, usage-based billing, quota management, and integration with payment processors like Stripe.

## 🎯 Core Objectives

1. **Flexible Pricing Models**: Support for tiered subscriptions and usage-based billing
2. **Quota Management**: Enforce limits based on subscription plans
3. **Usage Tracking**: Accurate billing based on actual usage
4. **Payment Integration**: Seamless integration with Stripe and other processors
5. **Billing Automation**: Automated invoice generation and payment processing
6. **Subscription Lifecycle**: Handle upgrades, downgrades, and cancellations

## 📋 Subscription Management Tables

### 1. Subscription Plans (`subscription_plans`)

**Purpose**: Define available pricing tiers and their associated limits.

**Plan Configuration**:
```sql
-- Basic plan information
name VARCHAR(100) UNIQUE         -- Starter, Professional, Enterprise
description TEXT                 -- Plan description for customers
plan_code VARCHAR(50) UNIQUE     -- Internal code for API integration

-- Pricing structure
price DECIMAL(10,2)             -- Base price (monthly/yearly)
currency VARCHAR(3) DEFAULT 'USD'
billing_interval VARCHAR(20)    -- monthly, yearly, usage_based
setup_fee DECIMAL(10,2) DEFAULT 0.0
cancellation_fee DECIMAL(10,2) DEFAULT 0.0

-- Usage limits
max_api_calls BIGINT            -- Monthly API call limit
max_tokens BIGINT               -- Monthly token limit
max_storage_mb BIGINT           -- Storage limit in MB
max_processing_min BIGINT       -- Monthly processing minutes
max_workspaces INTEGER          -- Number of workspaces allowed
max_users INTEGER               -- Users per workspace
max_file_size BIGINT            -- Maximum individual file size

-- Feature flags
features TEXT[]                 -- Array of enabled features
api_rate_limit INTEGER          -- Requests per minute
priority_processing BOOLEAN DEFAULT false
advanced_analytics BOOLEAN DEFAULT false
white_label_branding BOOLEAN DEFAULT false
custom_integrations BOOLEAN DEFAULT false
dedicated_support BOOLEAN DEFAULT false

-- Plan status
is_active BOOLEAN DEFAULT true
is_public BOOLEAN DEFAULT true  -- Show in public pricing
sort_order INTEGER DEFAULT 0   -- Display order
```

**Example Plans**:
```sql
INSERT INTO subscription_plans (
    name, description, plan_code, price, billing_interval,
    max_api_calls, max_tokens, max_storage_mb, max_processing_min,
    max_workspaces, max_users, features
) VALUES 
(
    'Starter',
    'Perfect for individuals and small projects',
    'starter_monthly',
    9.99,
    'monthly',
    1000,      -- 1K API calls
    50000,     -- 50K tokens
    1024,      -- 1GB storage
    60,        -- 1 hour processing
    1,         -- 1 workspace
    3,         -- 3 users
    ARRAY['basic_transcription', 'basic_summarization']
),
(
    'Professional',
    'Ideal for growing teams and businesses',
    'pro_monthly',
    29.99,
    'monthly',
    10000,     -- 10K API calls
    500000,    -- 500K tokens
    10240,     -- 10GB storage
    600,       -- 10 hours processing
    5,         -- 5 workspaces
    25,        -- 25 users
    ARRAY['advanced_transcription', 'advanced_summarization', 'voice_synthesis', 'analytics']
),
(
    'Enterprise',
    'For large organizations with advanced needs',
    'enterprise_monthly',
    99.99,
    'monthly',
    100000,    -- 100K API calls
    5000000,   -- 5M tokens
    102400,    -- 100GB storage
    6000,      -- 100 hours processing
    -1,        -- Unlimited workspaces
    -1,        -- Unlimited users
    ARRAY['all_features', 'priority_support', 'white_label', 'api_access']
);
```

### 2. Workspace Subscriptions (`workspace_subscriptions`)

**Purpose**: Track active subscriptions for each workspace.

**Subscription Lifecycle**:
```sql
-- Plan and billing
plan_id UUID NOT NULL           -- Reference to subscription plan
workspace_id UUID NOT NULL      -- Workspace being billed

-- Subscription status
status VARCHAR(50) DEFAULT 'active'  -- active, cancelled, expired, past_due, trialing
trial_end_date DATE             -- End of trial period
grace_period_end DATE           -- Grace period for failed payments

-- Billing periods
current_period_start DATE       -- Current billing period start
current_period_end DATE         -- Current billing period end
next_billing_date DATE          -- Next charge date
billing_day INTEGER             -- Day of month for billing (1-31)

-- Payment processing
payment_method_id VARCHAR(255)  -- Stripe payment method ID
stripe_subscription_id VARCHAR(255) UNIQUE
stripe_customer_id VARCHAR(255)
last_payment_date DATE
last_payment_amount DECIMAL(10,2)
failed_payment_count INTEGER DEFAULT 0

-- Usage-based billing
usage_billing_enabled BOOLEAN DEFAULT false
usage_billing_threshold DECIMAL(10,2)  -- Minimum usage charge
overage_rates JSONB            -- Rates for usage beyond plan limits

-- Lifecycle tracking
created_at TIMESTAMP DEFAULT NOW()
activated_at TIMESTAMP         -- When subscription became active
cancelled_at TIMESTAMP         -- When cancellation was requested
expires_at TIMESTAMP           -- When access expires
updated_at TIMESTAMP DEFAULT NOW()
```

**Subscription States**:
- **trialing**: Free trial period
- **active**: Subscription is active and paid
- **past_due**: Payment failed, in grace period
- **cancelled**: Cancelled but still active until period end
- **expired**: No longer active, access revoked

### 3. Billing Records (`billing_records`)

**Purpose**: Track all billing transactions and invoice history.

**Invoice Management**:
```sql
-- Invoice identification
subscription_id UUID NOT NULL   -- Parent subscription
invoice_number VARCHAR(100) UNIQUE  -- Human-readable invoice number
invoice_type VARCHAR(50)        -- subscription, usage, one_time, adjustment

-- Financial details
subtotal DECIMAL(10,2)          -- Before taxes and fees
tax_amount DECIMAL(10,2) DEFAULT 0.0
discount_amount DECIMAL(10,2) DEFAULT 0.0
total_amount DECIMAL(10,2)      -- Final amount charged
currency VARCHAR(3) DEFAULT 'USD'

-- Payment status
status VARCHAR(50)              -- draft, open, paid, void, uncollectible
payment_status VARCHAR(50)      -- pending, succeeded, failed, refunded
payment_method VARCHAR(50)      -- card, bank_transfer, paypal

-- Important dates
invoice_date DATE               -- Invoice generation date
due_date DATE                   -- Payment due date
paid_at TIMESTAMP              -- When payment was received
voided_at TIMESTAMP            -- When invoice was voided

-- External system integration
stripe_invoice_id VARCHAR(255) UNIQUE
stripe_payment_intent_id VARCHAR(255)
stripe_charge_id VARCHAR(255)

-- Line items and usage details
line_items JSONB               -- Detailed breakdown of charges
usage_details JSONB            -- Usage that generated this bill
billing_notes TEXT             -- Internal notes
customer_notes TEXT            -- Notes visible to customer

-- Collections and dunning
dunning_attempts INTEGER DEFAULT 0
next_dunning_date DATE
collection_status VARCHAR(50)  -- none, in_progress, resolved, written_off
```

**Usage-Based Billing Details**:
```sql
-- Usage charges breakdown in line_items JSONB
{
  "subscription_fee": {
    "description": "Professional Plan - Monthly",
    "quantity": 1,
    "unit_price": 29.99,
    "total": 29.99
  },
  "api_overage": {
    "description": "API Calls Overage (2,500 calls)",
    "quantity": 2500,
    "unit_price": 0.001,
    "total": 2.50
  },
  "token_overage": {
    "description": "Token Usage Overage (150K tokens)",
    "quantity": 150000,
    "unit_price": 0.00002,
    "total": 3.00
  },
  "storage_overage": {
    "description": "Storage Overage (2GB)",
    "quantity": 2048,
    "unit_price": 0.01,
    "total": 20.48
  }
}
```

### 4. Usage-Based Pricing (`usage_pricing_tiers`)

**Purpose**: Define pricing for usage beyond plan limits.

```sql
CREATE TABLE usage_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES subscription_plans(id),
    
    -- Usage type
    usage_type VARCHAR(50) NOT NULL,  -- api_calls, tokens, storage_mb, processing_min
    
    -- Pricing tiers
    tier_start BIGINT NOT NULL,       -- Usage amount where this tier starts
    tier_end BIGINT,                  -- Usage amount where this tier ends (NULL = unlimited)
    unit_price DECIMAL(10,6) NOT NULL, -- Price per unit in this tier
    
    -- Billing configuration
    billing_unit VARCHAR(50) DEFAULT 'unit',  -- unit, thousand, million
    minimum_charge DECIMAL(10,4) DEFAULT 0.0,
    rounding_mode VARCHAR(20) DEFAULT 'up',   -- up, down, nearest
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(plan_id, usage_type, tier_start)
);

-- Example: Progressive pricing for API calls
INSERT INTO usage_pricing_tiers (plan_id, usage_type, tier_start, tier_end, unit_price) VALUES
-- First 10K overage calls: $0.001 each
((SELECT id FROM subscription_plans WHERE plan_code = 'pro_monthly'), 'api_calls', 0, 10000, 0.001),
-- Next 40K overage calls: $0.0008 each  
((SELECT id FROM subscription_plans WHERE plan_code = 'pro_monthly'), 'api_calls', 10000, 50000, 0.0008),
-- Beyond 50K overage calls: $0.0005 each
((SELECT id FROM subscription_plans WHERE plan_code = 'pro_monthly'), 'api_calls', 50000, NULL, 0.0005);
```

### 5. Subscription Changes (`subscription_changes`)

**Purpose**: Track all subscription modifications for audit and revenue recognition.

```sql
CREATE TABLE subscription_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES workspace_subscriptions(id),
    
    -- Change details
    change_type VARCHAR(50) NOT NULL, -- upgrade, downgrade, cancel, reactivate, plan_change
    old_plan_id UUID REFERENCES subscription_plans(id),
    new_plan_id UUID REFERENCES subscription_plans(id),
    
    -- Financial impact
    proration_amount DECIMAL(10,2),   -- Prorated credit/charge
    effective_date DATE NOT NULL,     -- When change takes effect
    
    -- Change reason and context
    reason VARCHAR(100),              -- user_request, payment_failure, admin_action
    initiated_by UUID REFERENCES users(id),
    admin_notes TEXT,
    customer_notes TEXT,
    
    -- External system tracking
    stripe_invoice_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

## 💰 Billing Calculation Engine

### 1. Usage Aggregation

```typescript
interface UsageBillingEngine {
  calculateMonthlyBill(subscriptionId: string, billingPeriod: BillingPeriod): Promise<BillCalculation>
  calculateOverages(subscription: Subscription, usage: UsageData): Promise<OverageCharges>
  applyDiscounts(bill: BillCalculation, discounts: Discount[]): Promise<BillCalculation>
  generateInvoice(bill: BillCalculation): Promise<Invoice>
}

class BillingCalculator implements UsageBillingEngine {
  async calculateMonthlyBill(
    subscriptionId: string, 
    billingPeriod: BillingPeriod
  ): Promise<BillCalculation> {
    const subscription = await this.getSubscription(subscriptionId)
    const plan = await this.getPlan(subscription.planId)
    const usage = await this.getUsageForPeriod(subscriptionId, billingPeriod)
    
    // Base subscription fee
    const baseFee = this.calculateBaseFee(plan, billingPeriod)
    
    // Calculate overages
    const overages = await this.calculateOverages(subscription, usage)
    
    // Apply taxes
    const taxes = await this.calculateTaxes(subscription.workspaceId, baseFee + overages.total)
    
    // Apply discounts
    const discounts = await this.getActiveDiscounts(subscriptionId)
    const discountAmount = this.calculateDiscounts(baseFee + overages.total, discounts)
    
    return {
      subscriptionId,
      billingPeriod,
      baseFee,
      overages,
      taxes,
      discounts: discountAmount,
      total: baseFee + overages.total + taxes - discountAmount,
      lineItems: this.generateLineItems(baseFee, overages, taxes, discountAmount)
    }
  }
  
  async calculateOverages(
    subscription: Subscription, 
    usage: UsageData
  ): Promise<OverageCharges> {
    const plan = await this.getPlan(subscription.planId)
    const pricingTiers = await this.getPricingTiers(plan.id)
    
    const overages: OverageCharges = {
      apiCalls: 0,
      tokens: 0,
      storage: 0,
      processing: 0,
      total: 0
    }
    
    // Calculate API call overages
    if (usage.apiCalls > plan.maxApiCalls) {
      const overage = usage.apiCalls - plan.maxApiCalls
      overages.apiCalls = this.calculateTieredPricing(overage, pricingTiers.apiCalls)
    }
    
    // Calculate token overages
    if (usage.tokens > plan.maxTokens) {
      const overage = usage.tokens - plan.maxTokens
      overages.tokens = this.calculateTieredPricing(overage, pricingTiers.tokens)
    }
    
    // Calculate storage overages
    if (usage.storageMb > plan.maxStorageMb) {
      const overage = usage.storageMb - plan.maxStorageMb
      overages.storage = this.calculateTieredPricing(overage, pricingTiers.storage)
    }
    
    // Calculate processing overages
    if (usage.processingMin > plan.maxProcessingMin) {
      const overage = usage.processingMin - plan.maxProcessingMin
      overages.processing = this.calculateTieredPricing(overage, pricingTiers.processing)
    }
    
    overages.total = overages.apiCalls + overages.tokens + overages.storage + overages.processing
    
    return overages
  }
  
  private calculateTieredPricing(usage: number, tiers: PricingTier[]): number {
    let totalCost = 0
    let remainingUsage = usage
    
    for (const tier of tiers.sort((a, b) => a.tierStart - b.tierStart)) {
      if (remainingUsage <= 0) break
      
      const tierUsage = tier.tierEnd 
        ? Math.min(remainingUsage, tier.tierEnd - tier.tierStart)
        : remainingUsage
      
      totalCost += tierUsage * tier.unitPrice
      remainingUsage -= tierUsage
    }
    
    return totalCost
  }
}
```

### 2. Invoice Generation

```typescript
class InvoiceGenerator {
  async generateInvoice(bill: BillCalculation): Promise<Invoice> {
    const subscription = await this.getSubscription(bill.subscriptionId)
    const workspace = await this.getWorkspace(subscription.workspaceId)
    
    const invoiceNumber = await this.generateInvoiceNumber()
    
    const invoice = await this.prisma.billingRecord.create({
      data: {
        subscriptionId: bill.subscriptionId,
        invoiceNumber,
        invoiceType: 'subscription',
        subtotal: bill.baseFee + bill.overages.total,
        taxAmount: bill.taxes,
        discountAmount: bill.discounts,
        totalAmount: bill.total,
        status: 'open',
        invoiceDate: new Date(),
        dueDate: this.calculateDueDate(subscription.plan.paymentTerms),
        lineItems: bill.lineItems,
        usageDetails: this.formatUsageDetails(bill)
      }
    })
    
    // Create Stripe invoice if integrated
    if (subscription.stripeCustomerId) {
      const stripeInvoice = await this.createStripeInvoice(invoice, subscription)
      
      await this.prisma.billingRecord.update({
        where: { id: invoice.id },
        data: { stripeInvoiceId: stripeInvoice.id }
      })
    }
    
    // Send invoice email
    await this.sendInvoiceEmail(invoice, workspace)
    
    return invoice
  }
  
  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    
    const count = await this.prisma.billingRecord.count({
      where: {
        invoiceDate: {
          gte: new Date(year, date.getMonth(), 1),
          lt: new Date(year, date.getMonth() + 1, 1)
        }
      }
    })
    
    return `AT-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }
}
```

## 🔄 Subscription Lifecycle Management

### 1. Plan Changes and Upgrades

```typescript
class SubscriptionManager {
  async upgradePlan(
    subscriptionId: string, 
    newPlanId: string, 
    effective: 'immediate' | 'next_period' = 'immediate'
  ): Promise<SubscriptionChange> {
    const subscription = await this.getSubscription(subscriptionId)
    const oldPlan = await this.getPlan(subscription.planId)
    const newPlan = await this.getPlan(newPlanId)
    
    if (effective === 'immediate') {
      // Calculate proration
      const proration = await this.calculateProration(subscription, oldPlan, newPlan)
      
      // Update subscription
      await this.prisma.workspaceSubscription.update({
        where: { id: subscriptionId },
        data: { planId: newPlanId }
      })
      
      // Create change record
      const change = await this.recordSubscriptionChange({
        subscriptionId,
        changeType: 'upgrade',
        oldPlanId: oldPlan.id,
        newPlanId: newPlan.id,
        prorationAmount: proration,
        effectiveDate: new Date(),
        reason: 'user_request'
      })
      
      // Update quotas immediately
      await this.updateQuotas(subscription.workspaceId, newPlan)
      
      // Generate proration invoice
      if (proration > 0) {
        await this.generateProrationInvoice(subscription, proration)
      }
      
      return change
    } else {
      // Schedule for next billing period
      return await this.schedulePlanChange(subscriptionId, newPlanId)
    }
  }
  
  private async calculateProration(
    subscription: Subscription,
    oldPlan: Plan,
    newPlan: Plan
  ): Promise<number> {
    const now = new Date()
    const periodStart = subscription.currentPeriodStart
    const periodEnd = subscription.currentPeriodEnd
    
    const totalDays = differenceInDays(periodEnd, periodStart)
    const remainingDays = differenceInDays(periodEnd, now)
    
    const unusedCredit = (oldPlan.price * remainingDays) / totalDays
    const newCharge = (newPlan.price * remainingDays) / totalDays
    
    return newCharge - unusedCredit
  }
  
  async cancelSubscription(
    subscriptionId: string,
    cancellationType: 'immediate' | 'end_of_period' = 'end_of_period',
    reason?: string
  ): Promise<void> {
    const subscription = await this.getSubscription(subscriptionId)
    
    if (cancellationType === 'immediate') {
      // Cancel immediately and calculate refund
      const refund = await this.calculateRefund(subscription)
      
      await this.prisma.workspaceSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          expiresAt: new Date()
        }
      })
      
      if (refund > 0) {
        await this.processRefund(subscription, refund)
      }
      
      // Immediately downgrade to free tier
      await this.applyFreeTierLimits(subscription.workspaceId)
      
    } else {
      // Cancel at end of period
      await this.prisma.workspaceSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          expiresAt: subscription.currentPeriodEnd
        }
      })
    }
    
    // Cancel in Stripe if integrated
    if (subscription.stripeSubscriptionId) {
      await this.cancelStripeSubscription(
        subscription.stripeSubscriptionId,
        cancellationType === 'immediate'
      )
    }
    
    // Record cancellation
    await this.recordSubscriptionChange({
      subscriptionId,
      changeType: 'cancel',
      oldPlanId: subscription.planId,
      effectiveDate: cancellationType === 'immediate' ? new Date() : subscription.currentPeriodEnd,
      reason: reason || 'user_request'
    })
  }
}
```

### 2. Failed Payment Handling

```typescript
class PaymentFailureHandler {
  async handleFailedPayment(subscriptionId: string, failureReason: string): Promise<void> {
    const subscription = await this.getSubscription(subscriptionId)
    
    // Update failed payment count
    await this.prisma.workspaceSubscription.update({
      where: { id: subscriptionId },
      data: {
        failedPaymentCount: { increment: 1 },
        status: 'past_due'
      }
    })
    
    const failureCount = subscription.failedPaymentCount + 1
    
    if (failureCount === 1) {
      // First failure: Send notification, retry in 3 days
      await this.sendPaymentFailureNotification(subscription, 'first_failure')
      await this.schedulePaymentRetry(subscriptionId, 3)
      
    } else if (failureCount === 2) {
      // Second failure: Send warning, retry in 5 days
      await this.sendPaymentFailureNotification(subscription, 'second_failure')
      await this.schedulePaymentRetry(subscriptionId, 5)
      
    } else if (failureCount === 3) {
      // Third failure: Final warning, retry in 7 days
      await this.sendPaymentFailureNotification(subscription, 'final_warning')
      await this.schedulePaymentRetry(subscriptionId, 7)
      
    } else {
      // Multiple failures: Cancel subscription
      await this.cancelForNonPayment(subscriptionId)
    }
  }
  
  private async cancelForNonPayment(subscriptionId: string): Promise<void> {
    await this.prisma.workspaceSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'expired',
        expiresAt: new Date()
      }
    })
    
    // Downgrade to free tier immediately
    const subscription = await this.getSubscription(subscriptionId)
    await this.applyFreeTierLimits(subscription.workspaceId)
    
    // Send cancellation notice
    await this.sendCancellationNotice(subscription, 'non_payment')
    
    // Record change
    await this.recordSubscriptionChange({
      subscriptionId,
      changeType: 'cancel',
      oldPlanId: subscription.planId,
      effectiveDate: new Date(),
      reason: 'payment_failure'
    })
  }
}
```

## 📊 Revenue Analytics

### 1. Revenue Tracking

```sql
-- Monthly Recurring Revenue (MRR)
CREATE VIEW monthly_recurring_revenue AS
WITH subscription_mrr AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as month,
        sp.name as plan_name,
        COUNT(ws.id) as active_subscriptions,
        SUM(CASE 
            WHEN sp.billing_interval = 'monthly' THEN sp.price
            WHEN sp.billing_interval = 'yearly' THEN sp.price / 12.0
            ELSE 0
        END) as mrr_amount
    FROM workspace_subscriptions ws
    JOIN subscription_plans sp ON ws.plan_id = sp.id
    WHERE ws.status = 'active'
        AND ws.current_period_end >= CURRENT_DATE
    GROUP BY sp.name, sp.billing_interval, sp.price
)
SELECT 
    month,
    plan_name,
    active_subscriptions,
    mrr_amount,
    SUM(mrr_amount) OVER () as total_mrr
FROM subscription_mrr;

-- Customer Lifetime Value (CLV)
WITH customer_metrics AS (
    SELECT 
        ws.workspace_id,
        MIN(ws.created_at) as first_subscription,
        MAX(ws.current_period_end) as latest_period_end,
        COUNT(DISTINCT ws.id) as total_subscriptions,
        SUM(br.total_amount) as total_revenue,
        AVG(sp.price) as avg_monthly_price
    FROM workspace_subscriptions ws
    JOIN billing_records br ON ws.id = br.subscription_id
    JOIN subscription_plans sp ON ws.plan_id = sp.id
    WHERE br.status = 'paid'
    GROUP BY ws.workspace_id
)
SELECT 
    workspace_id,
    total_revenue,
    EXTRACT(MONTHS FROM age(latest_period_end, first_subscription)) as lifetime_months,
    total_revenue / NULLIF(EXTRACT(MONTHS FROM age(latest_period_end, first_subscription)), 0) as monthly_revenue,
    avg_monthly_price,
    total_revenue / NULLIF(avg_monthly_price, 0) as lifetime_value_ratio
FROM customer_metrics;
```

### 2. Churn Analysis

```sql
-- Churn rate calculation
CREATE VIEW monthly_churn_analysis AS
WITH monthly_stats AS (
    SELECT 
        DATE_TRUNC('month', date_series) as month,
        COUNT(CASE WHEN ws.created_at <= date_series 
                  AND (ws.cancelled_at IS NULL OR ws.cancelled_at > date_series) 
              THEN 1 END) as active_start,
        COUNT(CASE WHEN DATE_TRUNC('month', ws.cancelled_at) = DATE_TRUNC('month', date_series)
              THEN 1 END) as churned,
        COUNT(CASE WHEN DATE_TRUNC('month', ws.created_at) = DATE_TRUNC('month', date_series)
              THEN 1 END) as new_customers
    FROM generate_series(
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months'),
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
    ) as date_series
    CROSS JOIN workspace_subscriptions ws
    GROUP BY DATE_TRUNC('month', date_series)
)
SELECT 
    month,
    active_start,
    churned,
    new_customers,
    CASE WHEN active_start > 0 
         THEN (churned::FLOAT / active_start) * 100 
         ELSE 0 END as churn_rate_percent,
    active_start - churned + new_customers as active_end
FROM monthly_stats
WHERE month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
ORDER BY month;
```

This comprehensive subscription and billing system provides robust support for multiple pricing models, automated billing, payment processing, and revenue analytics while maintaining flexibility for future business model changes.