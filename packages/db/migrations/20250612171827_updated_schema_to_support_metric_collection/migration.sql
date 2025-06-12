/*
  Warnings:

  - You are about to drop the column `expires_at` on the `flag_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `flag_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `rule_id` on the `flag_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `user_identifier` on the `flag_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `variant` on the `flag_evaluations` table. All the data in the column will be lost.
  - Added the required column `rules_matched` to the `flag_evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "metric_type" AS ENUM ('EVALUATION_COUNT', 'ERROR_RATE', 'RESPONSE_TIME');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "audit_action" ADD VALUE 'ALERT_TRIGGERED';
ALTER TYPE "audit_action" ADD VALUE 'ALERT_ACKNOWLEDGED';
ALTER TYPE "audit_action" ADD VALUE 'ALERT_RESOLVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "audit_resource_type" ADD VALUE 'METRIC';
ALTER TYPE "audit_resource_type" ADD VALUE 'ALERT';
ALTER TYPE "audit_resource_type" ADD VALUE 'ALERT_PREFERENCE';

-- DropIndex
DROP INDEX "flag_evaluations_expires_at_idx";

-- DropIndex
DROP INDEX "flag_evaluations_flag_id_user_identifier_environment_idx";

-- AlterTable
ALTER TABLE "flag_evaluations" DROP COLUMN "expires_at",
DROP COLUMN "reason",
DROP COLUMN "rule_id",
DROP COLUMN "user_identifier",
DROP COLUMN "variant",
ADD COLUMN     "rules_matched" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "flag_environment_id" UUID NOT NULL,
    "metric_name" VARCHAR(255) NOT NULL,
    "metric_key" VARCHAR(255) NOT NULL,
    "metric_type" "metric_type" NOT NULL,
    "alert_conditions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "aggregation_window" INTEGER NOT NULL DEFAULT 300,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_evaluations_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric_id" UUID NOT NULL,
    "flag_evaluation_id" UUID NOT NULL,
    "variation_served" JSONB NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "serve_default" BOOLEAN NOT NULL DEFAULT false,
    "additional_data" JSONB,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flag_evaluations_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metrics_organization_id_metric_type_idx" ON "metrics"("organization_id", "metric_type");

-- CreateIndex
CREATE INDEX "metrics_flag_environment_id_metric_type_idx" ON "metrics"("flag_environment_id", "metric_type");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_organization_id_metric_key_key" ON "metrics"("organization_id", "metric_key");

-- CreateIndex
CREATE INDEX "flag_evaluations_metrics_metric_id_recorded_at_idx" ON "flag_evaluations_metrics"("metric_id", "recorded_at");

-- CreateIndex
CREATE INDEX "flag_evaluations_metrics_flag_evaluation_id_idx" ON "flag_evaluations_metrics"("flag_evaluation_id");

-- CreateIndex
CREATE INDEX "flag_evaluations_flag_id_environment_idx" ON "flag_evaluations"("flag_id", "environment");

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_flag_environment_id_fkey" FOREIGN KEY ("flag_environment_id") REFERENCES "flag_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_evaluations_metrics" ADD CONSTRAINT "flag_evaluations_metrics_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_evaluations_metrics" ADD CONSTRAINT "flag_evaluations_metrics_flag_evaluation_id_fkey" FOREIGN KEY ("flag_evaluation_id") REFERENCES "flag_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
