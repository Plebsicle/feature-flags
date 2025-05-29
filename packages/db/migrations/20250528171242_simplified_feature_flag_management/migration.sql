/*
  Warnings:

  - You are about to drop the column `default_value` on the `flag_environments` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `flag_rules` table. All the data in the column will be lost.
  - You are about to drop the `ab_tests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `alert_incidents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `alert_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feature_feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `flag_audit_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `flag_schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `flag_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `progressive_rollouts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `query_test_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `query_tests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rollout_stages` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `is_active` on table `feature_flags` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `feature_flags` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `feature_flags` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_enabled` on table `flag_environments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `flag_environments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `flag_environments` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `reason` to the `flag_evaluations` table without a default value. This is not possible if the table is not empty.
  - Made the column `evaluated_at` on table `flag_evaluations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `priority` on table `flag_rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `flag_rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `flag_rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `invitations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `organizations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `organizations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `owner_members` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `user_organizations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "audit_action" ADD VALUE 'EVALUATE';

-- AlterEnum
ALTER TYPE "flag_type" ADD VALUE 'MULTIVARIATE';

-- DropForeignKey
ALTER TABLE "ab_tests" DROP CONSTRAINT "ab_tests_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "alert_incidents" DROP CONSTRAINT "alert_incidents_alert_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "alert_incidents" DROP CONSTRAINT "alert_incidents_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "alert_incidents" DROP CONSTRAINT "alert_incidents_resolved_by_fkey";

-- DropForeignKey
ALTER TABLE "alert_rules" DROP CONSTRAINT "alert_rules_created_by_fkey";

-- DropForeignKey
ALTER TABLE "alert_rules" DROP CONSTRAINT "alert_rules_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "alert_rules" DROP CONSTRAINT "alert_rules_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "feature_feedback" DROP CONSTRAINT "feature_feedback_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "feature_flags" DROP CONSTRAINT "feature_flags_created_by_fkey";

-- DropForeignKey
ALTER TABLE "feature_flags" DROP CONSTRAINT "feature_flags_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_audit_log" DROP CONSTRAINT "flag_audit_log_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_audit_log" DROP CONSTRAINT "flag_audit_log_user_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_environments" DROP CONSTRAINT "flag_environments_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_evaluations" DROP CONSTRAINT "flag_evaluations_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_evaluations" DROP CONSTRAINT "flag_evaluations_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_rules" DROP CONSTRAINT "flag_rules_flag_environment_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_schedules" DROP CONSTRAINT "flag_schedules_created_by_fkey";

-- DropForeignKey
ALTER TABLE "flag_schedules" DROP CONSTRAINT "flag_schedules_flag_environment_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_templates" DROP CONSTRAINT "flag_templates_created_by_fkey";

-- DropForeignKey
ALTER TABLE "flag_templates" DROP CONSTRAINT "flag_templates_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_invited_by_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "owner_members" DROP CONSTRAINT "owner_members_member_id_fkey";

-- DropForeignKey
ALTER TABLE "owner_members" DROP CONSTRAINT "owner_members_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "progressive_rollouts" DROP CONSTRAINT "progressive_rollouts_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "query_test_results" DROP CONSTRAINT "query_test_results_query_test_id_fkey";

-- DropForeignKey
ALTER TABLE "query_tests" DROP CONSTRAINT "query_tests_created_by_fkey";

-- DropForeignKey
ALTER TABLE "query_tests" DROP CONSTRAINT "query_tests_flag_id_fkey";

-- DropForeignKey
ALTER TABLE "rollout_stages" DROP CONSTRAINT "rollout_stages_rollout_id_fkey";

-- DropForeignKey
ALTER TABLE "user_organizations" DROP CONSTRAINT "user_organizations_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "user_organizations" DROP CONSTRAINT "user_organizations_user_id_fkey";

-- DropIndex
DROP INDEX "idx_flag_evaluations_lookup";

-- DropIndex
DROP INDEX "idx_flag_rules_environment_priority";

-- AlterTable
ALTER TABLE "feature_flags" ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "flag_environments" DROP COLUMN "default_value",
ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "is_enabled" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "flag_evaluations" ADD COLUMN     "reason" VARCHAR(100) NOT NULL,
ADD COLUMN     "variant" VARCHAR(100),
ALTER COLUMN "evaluated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "flag_rules" DROP COLUMN "is_active",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_enabled" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "conditions" SET DEFAULT '{}',
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "owner_members" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_organizations" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- DropTable
DROP TABLE "ab_tests";

-- DropTable
DROP TABLE "alert_incidents";

-- DropTable
DROP TABLE "alert_rules";

-- DropTable
DROP TABLE "feature_feedback";

-- DropTable
DROP TABLE "flag_audit_log";

-- DropTable
DROP TABLE "flag_schedules";

-- DropTable
DROP TABLE "flag_templates";

-- DropTable
DROP TABLE "progressive_rollouts";

-- DropTable
DROP TABLE "query_test_results";

-- DropTable
DROP TABLE "query_tests";

-- DropTable
DROP TABLE "rollout_stages";

-- DropEnum
DROP TYPE "rollout_status";

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID,
    "user_id" UUID,
    "action" "audit_action" NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "environment" "environment_type",
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_flag_id_created_at_idx" ON "audit_logs"("flag_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "feature_flags_organization_id_flag_type_idx" ON "feature_flags"("organization_id", "flag_type");

-- CreateIndex
CREATE INDEX "flag_evaluations_flag_id_user_identifier_environment_idx" ON "flag_evaluations"("flag_id", "user_identifier", "environment");

-- CreateIndex
CREATE INDEX "flag_evaluations_flag_id_environment_evaluated_at_idx" ON "flag_evaluations"("flag_id", "environment", "evaluated_at");

-- CreateIndex
CREATE INDEX "flag_evaluations_expires_at_idx" ON "flag_evaluations"("expires_at");

-- CreateIndex
CREATE INDEX "flag_rules_flag_environment_id_priority_idx" ON "flag_rules"("flag_environment_id", "priority");

-- CreateIndex
CREATE INDEX "flag_rules_flag_environment_id_is_enabled_idx" ON "flag_rules"("flag_environment_id", "is_enabled");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_members" ADD CONSTRAINT "owner_members_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_members" ADD CONSTRAINT "owner_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_environments" ADD CONSTRAINT "flag_environments_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_rules" ADD CONSTRAINT "flag_rules_flag_environment_id_fkey" FOREIGN KEY ("flag_environment_id") REFERENCES "flag_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_evaluations" ADD CONSTRAINT "flag_evaluations_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_feature_flags_org_key" RENAME TO "feature_flags_organization_id_key_idx";

-- RenameIndex
ALTER INDEX "idx_flag_environments_flag_env" RENAME TO "flag_environments_flag_id_environment_idx";

-- RenameIndex
ALTER INDEX "idx_invitations_email_org" RENAME TO "invitations_email_organization_id_idx";

-- RenameIndex
ALTER INDEX "idx_invitations_expiry" RENAME TO "invitations_expires_at_is_used_idx";

-- RenameIndex
ALTER INDEX "idx_invitations_token" RENAME TO "invitations_token_idx";

-- RenameIndex
ALTER INDEX "idx_organizations_owner" RENAME TO "organizations_owner_id_idx";

-- RenameIndex
ALTER INDEX "idx_owner_members_member" RENAME TO "owner_members_member_id_idx";

-- RenameIndex
ALTER INDEX "idx_owner_members_owner" RENAME TO "owner_members_owner_id_idx";

-- RenameIndex
ALTER INDEX "idx_user_organizations_org_role" RENAME TO "user_organizations_organization_id_role_idx";
