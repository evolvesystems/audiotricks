-- AudioTricks Plan Recommendation Engine
-- This file contains AI-powered plan recommendation system for upgrade suggestions

-- =======================================================
-- PLAN RECOMMENDATION ENGINE
-- =======================================================

-- Function to analyze user usage patterns and recommend plan upgrades
CREATE OR REPLACE FUNCTION analyze_usage_patterns(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL,
    analysis_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    usage_pattern_summary JSONB,
    growth_trend TEXT,
    bottlenecks TEXT[],
    cost_efficiency_score DECIMAL(3,2),
    recommendation_score DECIMAL(3,2)
) AS $$
DECLARE
    daily_usage RECORD;
    monthly_usage RECORD;
    current_plan RECORD;
    bottlenecks_array TEXT[] := '{}';
    growth_rate DECIMAL;
    efficiency_score DECIMAL;
    rec_score DECIMAL;
    usage_summary JSONB;
BEGIN
    -- Get current plan limits
    SELECT * INTO current_plan FROM get_plan_limits(user_uuid, workspace_uuid);
    
    -- Analyze daily usage patterns
    SELECT 
        AVG(transcriptions_used) as avg_daily_transcriptions,
        AVG(files_uploaded) as avg_daily_files,
        AVG(voice_synthesis_used) as avg_daily_voice_synthesis,
        MAX(transcriptions_used) as peak_daily_transcriptions,
        MAX(files_uploaded) as peak_daily_files,
        MAX(concurrent_jobs_peak) as peak_concurrent_jobs,
        COUNT(*) as days_with_activity
    INTO daily_usage
    FROM usage_counters
    WHERE user_id = user_uuid
        AND (workspace_id = workspace_uuid OR (workspace_id IS NULL AND workspace_uuid IS NULL))
        AND period_type = 'daily'
        AND period_start >= CURRENT_DATE - analysis_days;
    
    -- Analyze monthly usage patterns
    SELECT 
        AVG(transcriptions_used) as avg_monthly_transcriptions,
        AVG(files_uploaded) as avg_monthly_files,
        AVG(voice_synthesis_used) as avg_monthly_voice_synthesis,
        MAX(transcriptions_used) as peak_monthly_transcriptions,
        MAX(files_uploaded) as peak_monthly_files
    INTO monthly_usage
    FROM usage_counters
    WHERE user_id = user_uuid
        AND (workspace_id = workspace_uuid OR (workspace_id IS NULL AND workspace_uuid IS NULL))
        AND period_type = 'monthly'
        AND period_start >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months';
    
    -- Calculate growth trend
    growth_rate := COALESCE(
        (monthly_usage.peak_monthly_transcriptions - monthly_usage.avg_monthly_transcriptions) / 
        NULLIF(monthly_usage.avg_monthly_transcriptions, 0), 0
    );
    
    -- Identify bottlenecks
    IF current_plan.max_transcriptions_monthly > 0 AND 
       monthly_usage.peak_monthly_transcriptions >= current_plan.max_transcriptions_monthly * 0.8 THEN
        bottlenecks_array := array_append(bottlenecks_array, 'transcription_limit');
    END IF;
    
    IF current_plan.max_files_daily > 0 AND 
       daily_usage.peak_daily_files >= current_plan.max_files_daily * 0.8 THEN
        bottlenecks_array := array_append(bottlenecks_array, 'daily_file_limit');
    END IF;
    
    IF current_plan.max_files_monthly > 0 AND 
       monthly_usage.peak_monthly_files >= current_plan.max_files_monthly * 0.8 THEN
        bottlenecks_array := array_append(bottlenecks_array, 'monthly_file_limit');
    END IF;
    
    IF current_plan.max_concurrent_jobs > 0 AND 
       daily_usage.peak_concurrent_jobs >= current_plan.max_concurrent_jobs THEN
        bottlenecks_array := array_append(bottlenecks_array, 'concurrent_job_limit');
    END IF;
    
    IF current_plan.max_voice_synthesis_monthly > 0 AND 
       monthly_usage.peak_monthly_voice_synthesis >= current_plan.max_voice_synthesis_monthly * 0.8 THEN
        bottlenecks_array := array_append(bottlenecks_array, 'voice_synthesis_limit');
    END IF;
    
    -- Calculate cost efficiency score (higher is better)
    efficiency_score := LEAST(1.0, GREATEST(0.0, 
        1.0 - (array_length(bottlenecks_array, 1) * 0.2)
    ));
    
    -- Calculate recommendation score based on usage patterns and growth
    rec_score := CASE 
        WHEN array_length(bottlenecks_array, 1) >= 2 THEN 0.9
        WHEN array_length(bottlenecks_array, 1) = 1 THEN 0.7
        WHEN growth_rate > 0.5 THEN 0.6
        WHEN growth_rate > 0.2 THEN 0.4
        ELSE 0.2
    END;
    
    -- Build usage summary JSON
    usage_summary := jsonb_build_object(
        'analysis_period_days', analysis_days,
        'daily_patterns', jsonb_build_object(
            'avg_transcriptions', COALESCE(daily_usage.avg_daily_transcriptions, 0),
            'avg_files', COALESCE(daily_usage.avg_daily_files, 0),
            'avg_voice_synthesis', COALESCE(daily_usage.avg_daily_voice_synthesis, 0),
            'peak_transcriptions', COALESCE(daily_usage.peak_daily_transcriptions, 0),
            'peak_files', COALESCE(daily_usage.peak_daily_files, 0),
            'peak_concurrent_jobs', COALESCE(daily_usage.peak_concurrent_jobs, 0),
            'days_with_activity', COALESCE(daily_usage.days_with_activity, 0)
        ),
        'monthly_patterns', jsonb_build_object(
            'avg_transcriptions', COALESCE(monthly_usage.avg_monthly_transcriptions, 0),
            'avg_files', COALESCE(monthly_usage.avg_monthly_files, 0),
            'avg_voice_synthesis', COALESCE(monthly_usage.avg_monthly_voice_synthesis, 0),
            'peak_transcriptions', COALESCE(monthly_usage.peak_monthly_transcriptions, 0),
            'peak_files', COALESCE(monthly_usage.peak_monthly_files, 0)
        ),
        'growth_metrics', jsonb_build_object(
            'transcription_growth_rate', growth_rate,
            'usage_consistency', COALESCE(daily_usage.days_with_activity, 0)::FLOAT / analysis_days
        )
    );
    
    RETURN QUERY SELECT
        usage_summary,
        CASE 
            WHEN growth_rate > 0.5 THEN 'rapid_growth'
            WHEN growth_rate > 0.2 THEN 'steady_growth'
            WHEN growth_rate > 0 THEN 'slow_growth'
            WHEN growth_rate < -0.2 THEN 'declining'
            ELSE 'stable'
        END,
        bottlenecks_array,
        efficiency_score,
        rec_score;
END;
$$ LANGUAGE plpgsql;

-- Function to generate plan recommendations based on usage analysis
CREATE OR REPLACE FUNCTION generate_plan_recommendation(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    recommended_plan_id UUID,
    recommended_plan_name TEXT,
    current_plan_name TEXT,
    recommendation_reason TEXT,
    confidence_score DECIMAL(3,2),
    monthly_cost_change DECIMAL(10,2),
    annual_savings DECIMAL(10,2),
    benefits TEXT[],
    limitations_removed TEXT[],
    roi_months INTEGER
) AS $$
DECLARE
    current_plan RECORD;
    analysis RECORD;
    best_plan RECORD;
    cost_change DECIMAL;
    savings_annual DECIMAL;
    benefits_array TEXT[] := '{}';
    limitations_array TEXT[] := '{}';
    roi_period INTEGER;
BEGIN
    -- Get current plan
    SELECT sp.*, ws.plan_id as current_plan_id
    INTO current_plan
    FROM get_plan_limits(user_uuid, workspace_uuid) pl
    JOIN subscription_plans sp ON sp.name = pl.plan_name
    LEFT JOIN workspace_subscriptions ws ON ws.workspace_id = workspace_uuid AND ws.status = 'active';
    
    -- Analyze usage patterns
    SELECT * INTO analysis FROM analyze_usage_patterns(user_uuid, workspace_uuid, 30);
    
    -- Find best plan recommendation based on usage patterns and bottlenecks
    SELECT sp.* INTO best_plan
    FROM subscription_plans sp
    WHERE sp.is_active = true 
        AND sp.is_public = true
        AND sp.price > current_plan.price -- Only suggest upgrades
        AND (
            -- Address transcription bottleneck
            ('transcription_limit' = ANY(analysis.bottlenecks) AND 
             (sp.max_transcriptions_monthly = -1 OR 
              sp.max_transcriptions_monthly > current_plan.max_transcriptions_monthly)) OR
            
            -- Address file upload bottleneck
            (('daily_file_limit' = ANY(analysis.bottlenecks) OR 'monthly_file_limit' = ANY(analysis.bottlenecks)) AND 
             (sp.max_files_daily = -1 OR sp.max_files_daily > current_plan.max_files_daily) AND
             (sp.max_files_monthly = -1 OR sp.max_files_monthly > current_plan.max_files_monthly)) OR
            
            -- Address concurrent job bottleneck
            ('concurrent_job_limit' = ANY(analysis.bottlenecks) AND 
             sp.max_concurrent_jobs > current_plan.max_concurrent_jobs) OR
            
            -- Address voice synthesis bottleneck
            ('voice_synthesis_limit' = ANY(analysis.bottlenecks) AND 
             (sp.max_voice_synthesis_monthly = -1 OR 
              sp.max_voice_synthesis_monthly > current_plan.max_voice_synthesis_monthly)) OR
            
            -- General upgrade for growing usage
            (analysis.growth_trend IN ('rapid_growth', 'steady_growth') AND 
             sp.priority_level > current_plan.priority_level)
        )
    ORDER BY 
        -- Prioritize plans that solve the most bottlenecks
        (CASE WHEN 'transcription_limit' = ANY(analysis.bottlenecks) AND 
                   (sp.max_transcriptions_monthly = -1 OR sp.max_transcriptions_monthly > current_plan.max_transcriptions_monthly * 2) 
              THEN 2 ELSE 0 END +
         CASE WHEN ('daily_file_limit' = ANY(analysis.bottlenecks) OR 'monthly_file_limit' = ANY(analysis.bottlenecks)) AND 
                   (sp.max_files_monthly = -1 OR sp.max_files_monthly > current_plan.max_files_monthly * 2) 
              THEN 2 ELSE 0 END +
         CASE WHEN 'concurrent_job_limit' = ANY(analysis.bottlenecks) AND 
                   sp.max_concurrent_jobs > current_plan.max_concurrent_jobs 
              THEN 1 ELSE 0 END +
         CASE WHEN 'voice_synthesis_limit' = ANY(analysis.bottlenecks) AND 
                   (sp.max_voice_synthesis_monthly = -1 OR sp.max_voice_synthesis_monthly > current_plan.max_voice_synthesis_monthly) 
              THEN 1 ELSE 0 END) DESC,
        -- Then by value (lower price for similar benefits)
        sp.price ASC
    LIMIT 1;
    
    -- If no upgrade plan found, return null
    IF best_plan.id IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate cost implications
    cost_change := best_plan.price - current_plan.price;
    savings_annual := 0; -- For now, focusing on upgrade costs
    
    -- Calculate ROI (simplified - based on potential productivity gains)
    roi_period := CASE 
        WHEN array_length(analysis.bottlenecks, 1) >= 2 THEN 3 -- 3 months ROI if multiple bottlenecks
        WHEN array_length(analysis.bottlenecks, 1) = 1 THEN 6 -- 6 months ROI if one bottleneck
        ELSE 12 -- 12 months ROI for general upgrade
    END;
    
    -- Build benefits array
    IF best_plan.max_transcriptions_monthly = -1 OR best_plan.max_transcriptions_monthly > current_plan.max_transcriptions_monthly THEN
        benefits_array := array_append(benefits_array, 
            format('Increased transcription limit: %s → %s', 
                CASE WHEN current_plan.max_transcriptions_monthly = -1 THEN 'Unlimited' ELSE current_plan.max_transcriptions_monthly::TEXT END,
                CASE WHEN best_plan.max_transcriptions_monthly = -1 THEN 'Unlimited' ELSE best_plan.max_transcriptions_monthly::TEXT END));
    END IF;
    
    IF best_plan.max_concurrent_jobs > current_plan.max_concurrent_jobs THEN
        benefits_array := array_append(benefits_array, 
            format('More concurrent processing: %s → %s jobs', current_plan.max_concurrent_jobs, best_plan.max_concurrent_jobs));
    END IF;
    
    IF best_plan.priority_level > current_plan.priority_level THEN
        benefits_array := array_append(benefits_array, 'Higher processing priority');
    END IF;
    
    IF best_plan.max_voice_synthesis_monthly > current_plan.max_voice_synthesis_monthly THEN
        benefits_array := array_append(benefits_array, 'Voice synthesis included/increased');
    END IF;
    
    -- Build limitations removed array
    IF 'transcription_limit' = ANY(analysis.bottlenecks) THEN
        limitations_array := array_append(limitations_array, 'Monthly transcription limit blocking productivity');
    END IF;
    
    IF 'daily_file_limit' = ANY(analysis.bottlenecks) OR 'monthly_file_limit' = ANY(analysis.bottlenecks) THEN
        limitations_array := array_append(limitations_array, 'File upload limits causing delays');
    END IF;
    
    IF 'concurrent_job_limit' = ANY(analysis.bottlenecks) THEN
        limitations_array := array_append(limitations_array, 'Job queue bottleneck slowing workflow');
    END IF;
    
    RETURN QUERY SELECT
        best_plan.id,
        best_plan.name,
        current_plan.name,
        CASE 
            WHEN array_length(analysis.bottlenecks, 1) >= 2 THEN 'Multiple usage limits reached'
            WHEN array_length(analysis.bottlenecks, 1) = 1 THEN format('Usage limit reached: %s', analysis.bottlenecks[1])
            WHEN analysis.growth_trend = 'rapid_growth' THEN 'Rapid usage growth detected'
            WHEN analysis.growth_trend = 'steady_growth' THEN 'Steady usage growth pattern'
            ELSE 'Plan optimization opportunity'
        END,
        analysis.recommendation_score,
        cost_change,
        savings_annual,
        benefits_array,
        limitations_array,
        roi_period;
END;
$$ LANGUAGE plpgsql;

-- Function to create a plan recommendation record
CREATE OR REPLACE FUNCTION create_plan_recommendation(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL,
    trigger_reason TEXT DEFAULT 'automated_analysis'
)
RETURNS UUID AS $$
DECLARE
    recommendation RECORD;
    usage_analysis RECORD;
    recommendation_id UUID;
    expiry_date TIMESTAMP;
BEGIN
    -- Get plan recommendation
    SELECT * INTO recommendation FROM generate_plan_recommendation(user_uuid, workspace_uuid);
    
    -- If no recommendation found, return null
    IF recommendation.recommended_plan_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get usage analysis for detailed context
    SELECT * INTO usage_analysis FROM analyze_usage_patterns(user_uuid, workspace_uuid, 30);
    
    -- Set expiry date (30 days from now)
    expiry_date := CURRENT_TIMESTAMP + INTERVAL '30 days';
    
    -- Create recommendation record
    INSERT INTO plan_recommendations (
        user_id,
        workspace_id,
        current_plan_id,
        recommended_plan_id,
        recommendation_reason,
        confidence_score,
        usage_pattern,
        projected_savings,
        roi_months,
        triggered_by,
        benefits,
        limitations_removed,
        expires_at
    ) VALUES (
        user_uuid,
        workspace_uuid,
        (SELECT plan_id FROM workspace_subscriptions WHERE workspace_id = workspace_uuid AND status = 'active'),
        recommendation.recommended_plan_id,
        recommendation.recommendation_reason,
        recommendation.confidence_score,
        usage_analysis.usage_pattern_summary,
        recommendation.annual_savings,
        recommendation.roi_months,
        trigger_reason,
        recommendation.benefits,
        recommendation.limitations_removed,
        expiry_date
    ) RETURNING id INTO recommendation_id;
    
    RETURN recommendation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically trigger recommendations based on usage
CREATE OR REPLACE FUNCTION trigger_automatic_recommendations()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    workspace_record RECORD;
    recommendation_count INTEGER := 0;
    usage_analysis RECORD;
BEGIN
    -- Check all active workspace subscriptions
    FOR workspace_record IN 
        SELECT DISTINCT ws.workspace_id, wu.user_id
        FROM workspace_subscriptions ws
        JOIN workspace_users wu ON ws.workspace_id = wu.workspace_id
        WHERE ws.status = 'active'
            AND wu.role IN ('owner', 'admin')
            -- Only check workspaces that haven't had a recommendation in the last 7 days
            AND NOT EXISTS (
                SELECT 1 FROM plan_recommendations pr
                WHERE pr.workspace_id = ws.workspace_id
                    AND pr.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
            )
    LOOP
        -- Analyze usage patterns
        SELECT * INTO usage_analysis 
        FROM analyze_usage_patterns(workspace_record.user_id, workspace_record.workspace_id, 30);
        
        -- Create recommendation if confidence score is high enough
        IF usage_analysis.recommendation_score >= 0.7 THEN
            IF create_plan_recommendation(
                workspace_record.user_id, 
                workspace_record.workspace_id, 
                'automated_trigger'
            ) IS NOT NULL THEN
                recommendation_count := recommendation_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN recommendation_count;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- COST OPTIMIZATION FUNCTIONS
-- =======================================================

-- Function to analyze cost efficiency and suggest optimizations
CREATE OR REPLACE FUNCTION analyze_cost_efficiency(
    user_uuid UUID,
    workspace_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    current_monthly_cost DECIMAL(10,2),
    usage_efficiency_score DECIMAL(3,2),
    underutilized_features TEXT[],
    cost_per_transcription DECIMAL(10,4),
    cost_per_file DECIMAL(10,4),
    optimization_suggestion TEXT,
    potential_savings DECIMAL(10,2)
) AS $$
DECLARE
    current_plan RECORD;
    usage_stats RECORD;
    monthly_cost DECIMAL;
    efficiency DECIMAL;
    underutilized TEXT[] := '{}';
    transcription_cost DECIMAL;
    file_cost DECIMAL;
    suggestion TEXT;
    savings DECIMAL := 0;
BEGIN
    -- Get current plan and cost
    SELECT sp.* INTO current_plan
    FROM get_plan_limits(user_uuid, workspace_uuid) pl
    JOIN subscription_plans sp ON sp.name = pl.plan_name;
    
    monthly_cost := current_plan.price;
    
    -- Get recent usage statistics
    SELECT 
        AVG(transcriptions_used) as avg_transcriptions,
        AVG(files_uploaded) as avg_files,
        AVG(voice_synthesis_used) as avg_voice_synthesis,
        AVG(export_operations_used) as avg_exports
    INTO usage_stats
    FROM usage_counters
    WHERE user_id = user_uuid
        AND (workspace_id = workspace_uuid OR (workspace_id IS NULL AND workspace_uuid IS NULL))
        AND period_type = 'monthly'
        AND period_start >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months';
    
    -- Calculate efficiency score
    efficiency := LEAST(1.0, GREATEST(0.0,
        (COALESCE(usage_stats.avg_transcriptions, 0)::FLOAT / NULLIF(current_plan.max_transcriptions_monthly, 0)) * 0.4 +
        (COALESCE(usage_stats.avg_files, 0)::FLOAT / NULLIF(current_plan.max_files_monthly, 0)) * 0.3 +
        (COALESCE(usage_stats.avg_voice_synthesis, 0)::FLOAT / NULLIF(current_plan.max_voice_synthesis_monthly, 0)) * 0.2 +
        (COALESCE(usage_stats.avg_exports, 0)::FLOAT / NULLIF(current_plan.max_export_operations_monthly, 0)) * 0.1
    ));
    
    -- Identify underutilized features
    IF current_plan.max_voice_synthesis_monthly > 0 AND COALESCE(usage_stats.avg_voice_synthesis, 0) = 0 THEN
        underutilized := array_append(underutilized, 'voice_synthesis');
    END IF;
    
    IF 'api_access' = ANY(current_plan.integration_features) AND 
       (SELECT COUNT(*) FROM api_key_management WHERE user_id = user_uuid AND last_used_at > CURRENT_DATE - 30) = 0 THEN
        underutilized := array_append(underutilized, 'api_access');
    END IF;
    
    -- Calculate cost per unit
    transcription_cost := CASE 
        WHEN COALESCE(usage_stats.avg_transcriptions, 0) > 0 
        THEN monthly_cost / usage_stats.avg_transcriptions
        ELSE 0 
    END;
    
    file_cost := CASE 
        WHEN COALESCE(usage_stats.avg_files, 0) > 0 
        THEN monthly_cost / usage_stats.avg_files
        ELSE 0 
    END;
    
    -- Generate optimization suggestion
    IF efficiency < 0.3 THEN
        suggestion := 'Consider downgrading to a lower plan - current usage is much below plan limits';
        -- Calculate potential savings by finding a cheaper plan that still meets usage
        SELECT price INTO savings
        FROM subscription_plans sp
        WHERE sp.is_active = true 
            AND sp.price < current_plan.price
            AND (sp.max_transcriptions_monthly = -1 OR sp.max_transcriptions_monthly >= COALESCE(usage_stats.avg_transcriptions, 0) * 1.2)
            AND (sp.max_files_monthly = -1 OR sp.max_files_monthly >= COALESCE(usage_stats.avg_files, 0) * 1.2)
        ORDER BY sp.price DESC
        LIMIT 1;
        
        savings := COALESCE(current_plan.price - savings, 0);
    ELSIF efficiency < 0.6 THEN
        suggestion := 'Plan usage is moderate - monitor for 1-2 more months before making changes';
    ELSIF array_length(underutilized, 1) > 0 THEN
        suggestion := format('Consider using underutilized features: %s', array_to_string(underutilized, ', '));
    ELSE
        suggestion := 'Plan utilization is good - current plan fits usage well';
    END IF;
    
    RETURN QUERY SELECT
        monthly_cost,
        efficiency,
        underutilized,
        transcription_cost,
        file_cost,
        suggestion,
        savings;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- MONITORING AND ANALYTICS VIEWS
-- =======================================================

-- View for recommendation dashboard
CREATE OR REPLACE VIEW recommendation_dashboard AS
SELECT 
    pr.id,
    pr.user_id,
    u.username,
    u.email,
    pr.workspace_id,
    w.name as workspace_name,
    current_sp.name as current_plan,
    recommended_sp.name as recommended_plan,
    pr.recommendation_reason,
    pr.confidence_score,
    pr.projected_savings,
    pr.roi_months,
    pr.status,
    pr.created_at,
    pr.expires_at,
    CASE 
        WHEN pr.expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN pr.status = 'pending' AND pr.created_at < CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'stale'
        ELSE pr.status
    END as recommendation_status,
    pr.benefits,
    pr.limitations_removed
FROM plan_recommendations pr
JOIN users u ON pr.user_id = u.id
LEFT JOIN workspaces w ON pr.workspace_id = w.id
JOIN subscription_plans current_sp ON pr.current_plan_id = current_sp.id
JOIN subscription_plans recommended_sp ON pr.recommended_plan_id = recommended_sp.id
WHERE pr.status != 'dismissed'
ORDER BY pr.confidence_score DESC, pr.created_at DESC;

-- View for usage efficiency monitoring
CREATE OR REPLACE VIEW usage_efficiency_monitoring AS
SELECT 
    u.id as user_id,
    u.username,
    w.id as workspace_id,
    w.name as workspace_name,
    sp.name as plan_name,
    sp.price as monthly_cost,
    
    -- Efficiency metrics
    COALESCE(uc.transcriptions_used, 0)::FLOAT / NULLIF(sp.max_transcriptions_monthly, 0) as transcription_efficiency,
    COALESCE(uc.files_uploaded, 0)::FLOAT / NULLIF(sp.max_files_monthly, 0) as file_efficiency,
    COALESCE(uc.voice_synthesis_used, 0)::FLOAT / NULLIF(sp.max_voice_synthesis_monthly, 0) as voice_synthesis_efficiency,
    
    -- Overall efficiency score
    LEAST(1.0, GREATEST(0.0,
        (COALESCE(uc.transcriptions_used, 0)::FLOAT / NULLIF(sp.max_transcriptions_monthly, 0)) * 0.5 +
        (COALESCE(uc.files_uploaded, 0)::FLOAT / NULLIF(sp.max_files_monthly, 0)) * 0.3 +
        (COALESCE(uc.voice_synthesis_used, 0)::FLOAT / NULLIF(sp.max_voice_synthesis_monthly, 0)) * 0.2
    )) as overall_efficiency,
    
    -- Recommendation eligibility
    CASE 
        WHEN LEAST(1.0, GREATEST(0.0,
            (COALESCE(uc.transcriptions_used, 0)::FLOAT / NULLIF(sp.max_transcriptions_monthly, 0)) * 0.5 +
            (COALESCE(uc.files_uploaded, 0)::FLOAT / NULLIF(sp.max_files_monthly, 0)) * 0.3 +
            (COALESCE(uc.voice_synthesis_used, 0)::FLOAT / NULLIF(sp.max_voice_synthesis_monthly, 0)) * 0.2
        )) < 0.3 THEN 'downgrade_candidate'
        WHEN LEAST(1.0, GREATEST(0.0,
            (COALESCE(uc.transcriptions_used, 0)::FLOAT / NULLIF(sp.max_transcriptions_monthly, 0)) * 0.5 +
            (COALESCE(uc.files_uploaded, 0)::FLOAT / NULLIF(sp.max_files_monthly, 0)) * 0.3 +
            (COALESCE(uc.voice_synthesis_used, 0)::FLOAT / NULLIF(sp.max_voice_synthesis_monthly, 0)) * 0.2
        )) > 0.8 THEN 'upgrade_candidate'
        ELSE 'optimal'
    END as efficiency_category
    
FROM users u
LEFT JOIN workspace_users wu ON u.id = wu.user_id
LEFT JOIN workspaces w ON wu.workspace_id = w.id
LEFT JOIN workspace_subscriptions ws ON w.id = ws.workspace_id AND ws.status = 'active'
LEFT JOIN subscription_plans sp ON ws.plan_id = sp.id
LEFT JOIN usage_counters uc ON (
    u.id = uc.user_id 
    AND w.id = uc.workspace_id 
    AND uc.period_type = 'monthly'
    AND uc.period_start = DATE_TRUNC('month', CURRENT_DATE)
)
WHERE u.is_active = true AND sp.id IS NOT NULL;

RAISE NOTICE 'Plan recommendation engine installed successfully!';
RAISE NOTICE 'Key features:';
RAISE NOTICE '- analyze_usage_patterns(user_id, workspace_id, days) - Deep usage analysis';
RAISE NOTICE '- generate_plan_recommendation(user_id, workspace_id) - AI-powered recommendations';
RAISE NOTICE '- create_plan_recommendation(user_id, workspace_id) - Store recommendations';
RAISE NOTICE '- trigger_automatic_recommendations() - Automated recommendation generation';
RAISE NOTICE '- analyze_cost_efficiency(user_id, workspace_id) - Cost optimization analysis';
RAISE NOTICE '- recommendation_dashboard view - Management dashboard';
RAISE NOTICE '- usage_efficiency_monitoring view - Efficiency tracking';