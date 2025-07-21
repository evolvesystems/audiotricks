-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS "usage_tracking" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- Create usage_reports table
CREATE TABLE IF NOT EXISTS "usage_reports" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "storage_bytes" BIGINT NOT NULL,
    "processing_minutes" INTEGER NOT NULL,
    "api_calls" INTEGER NOT NULL,
    "transcription_minutes" INTEGER NOT NULL,
    "ai_tokens" INTEGER NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_reports_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "usage_tracking_workspace_id_created_at_idx" ON "usage_tracking"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "usage_tracking_resource_type_idx" ON "usage_tracking"("resource_type");
CREATE INDEX IF NOT EXISTS "usage_reports_workspace_id_period_idx" ON "usage_reports"("workspace_id", "period");
CREATE INDEX IF NOT EXISTS "usage_reports_workspace_id_start_date_idx" ON "usage_reports"("workspace_id", "start_date");

-- Add foreign keys
ALTER TABLE "usage_tracking" 
    DROP CONSTRAINT IF EXISTS "usage_tracking_workspace_id_fkey",
    ADD CONSTRAINT "usage_tracking_workspace_id_fkey" 
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usage_reports" 
    DROP CONSTRAINT IF EXISTS "usage_reports_workspace_id_fkey",
    ADD CONSTRAINT "usage_reports_workspace_id_fkey" 
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;