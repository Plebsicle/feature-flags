-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE');

-- CreateEnum
CREATE TYPE "environment_type" AS ENUM ('DEV', 'STAGING', 'PROD');

-- CreateEnum
CREATE TYPE "flag_type" AS ENUM ('BOOLEAN', 'PERCENTAGE', 'AB_TEST', 'KILL_SWITCH');

-- CreateEnum
CREATE TYPE "rollout_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'VIEWER', 'MEMBER', 'OWNER');

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "variants" JSONB NOT NULL,
    "traffic_allocation" INTEGER DEFAULT 100,
    "is_active" BOOLEAN DEFAULT false,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_incidents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alert_rule_id" UUID NOT NULL,
    "flag_id" UUID,
    "severity" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) DEFAULT 'OPEN',
    "triggered_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" UUID,

    CONSTRAINT "alert_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "condition" JSONB NOT NULL,
    "channels" JSONB NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "user_identifier" VARCHAR(255) NOT NULL,
    "feedback_type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "environment" "environment_type",
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "flag_type" "flag_type" NOT NULL,
    "is_active" BOOLEAN DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[],

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID,
    "user_id" UUID,
    "action" "audit_action" NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "environment" "environment_type",
    "metadata" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flag_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_environments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "environment" "environment_type" NOT NULL,
    "is_enabled" BOOLEAN DEFAULT false,
    "default_value" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flag_environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "user_identifier" VARCHAR(255) NOT NULL,
    "environment" "environment_type" NOT NULL,
    "value" JSONB NOT NULL,
    "rule_id" UUID,
    "evaluated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "flag_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_environment_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "conditions" JSONB NOT NULL,
    "value" JSONB NOT NULL,
    "priority" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flag_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_environment_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "executed_at" TIMESTAMPTZ(6),
    "new_value" JSONB,
    "is_executed" BOOLEAN DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flag_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "template_type" VARCHAR(50) NOT NULL,
    "configuration" JSONB NOT NULL,
    "is_public" BOOLEAN DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flag_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progressive_rollouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "rollout_status" DEFAULT 'DRAFT',
    "current_percentage" INTEGER DEFAULT 0,
    "target_percentage" INTEGER DEFAULT 100,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progressive_rollouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_test_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query_test_id" UUID NOT NULL,
    "environment" "environment_type" NOT NULL,
    "original_result_hash" VARCHAR(64),
    "new_result_hash" VARCHAR(64),
    "results_match" BOOLEAN,
    "execution_time_ms" INTEGER,
    "error_message" TEXT,
    "executed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "original_query" TEXT NOT NULL,
    "new_query" TEXT NOT NULL,
    "is_active" BOOLEAN DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rollout_stages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rollout_id" UUID NOT NULL,
    "stage_number" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "duration_hours" INTEGER,
    "scheduled_at" TIMESTAMPTZ(6),
    "executed_at" TIMESTAMPTZ(6),
    "is_completed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rollout_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "organization_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_feature_flags_org_key" ON "feature_flags"("organization_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_organization_id_key_key" ON "feature_flags"("organization_id", "key");

-- CreateIndex
CREATE INDEX "idx_flag_audit_log_flag_created" ON "flag_audit_log"("flag_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_flag_environments_flag_env" ON "flag_environments"("flag_id", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "flag_environments_flag_id_environment_key" ON "flag_environments"("flag_id", "environment");

-- CreateIndex
CREATE INDEX "idx_flag_evaluations_lookup" ON "flag_evaluations"("flag_id", "user_identifier", "environment", "expires_at");

-- CreateIndex
CREATE INDEX "idx_flag_rules_environment_priority" ON "flag_rules"("flag_environment_id", "priority" DESC);

-- CreateIndex
CREATE INDEX "idx_flag_schedules_execution" ON "flag_schedules"("scheduled_at", "is_executed");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_owner" ON "organizations"("owner_id");

-- CreateIndex
CREATE INDEX "idx_rollout_stages_scheduled" ON "rollout_stages"("scheduled_at", "is_completed");

-- CreateIndex
CREATE UNIQUE INDEX "rollout_stages_rollout_id_stage_number_key" ON "rollout_stages"("rollout_id", "stage_number");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "idx_invitations_token" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "idx_invitations_email_org" ON "invitations"("email", "organization_id");

-- CreateIndex
CREATE INDEX "idx_invitations_expiry" ON "invitations"("expires_at", "is_used");

-- CreateIndex
CREATE INDEX "idx_owner_members_owner" ON "owner_members"("owner_id");

-- CreateIndex
CREATE INDEX "idx_owner_members_member" ON "owner_members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "owner_members_owner_id_member_id_key" ON "owner_members"("owner_id", "member_id");

-- CreateIndex
CREATE INDEX "idx_user_organizations_org_role" ON "user_organizations"("organization_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_user_id_organization_id_key" ON "user_organizations"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_incidents" ADD CONSTRAINT "alert_incidents_alert_rule_id_fkey" FOREIGN KEY ("alert_rule_id") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_incidents" ADD CONSTRAINT "alert_incidents_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_incidents" ADD CONSTRAINT "alert_incidents_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feature_feedback" ADD CONSTRAINT "feature_feedback_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_audit_log" ADD CONSTRAINT "flag_audit_log_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_audit_log" ADD CONSTRAINT "flag_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_environments" ADD CONSTRAINT "flag_environments_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_evaluations" ADD CONSTRAINT "flag_evaluations_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_evaluations" ADD CONSTRAINT "flag_evaluations_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "flag_rules"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_rules" ADD CONSTRAINT "flag_rules_flag_environment_id_fkey" FOREIGN KEY ("flag_environment_id") REFERENCES "flag_environments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_schedules" ADD CONSTRAINT "flag_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_schedules" ADD CONSTRAINT "flag_schedules_flag_environment_id_fkey" FOREIGN KEY ("flag_environment_id") REFERENCES "flag_environments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_templates" ADD CONSTRAINT "flag_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flag_templates" ADD CONSTRAINT "flag_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "progressive_rollouts" ADD CONSTRAINT "progressive_rollouts_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "query_test_results" ADD CONSTRAINT "query_test_results_query_test_id_fkey" FOREIGN KEY ("query_test_id") REFERENCES "query_tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "query_tests" ADD CONSTRAINT "query_tests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "query_tests" ADD CONSTRAINT "query_tests_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rollout_stages" ADD CONSTRAINT "rollout_stages_rollout_id_fkey" FOREIGN KEY ("rollout_id") REFERENCES "progressive_rollouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "owner_members" ADD CONSTRAINT "owner_members_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "owner_members" ADD CONSTRAINT "owner_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
