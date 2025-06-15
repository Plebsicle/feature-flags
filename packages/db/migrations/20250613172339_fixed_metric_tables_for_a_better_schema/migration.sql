/*
  Warnings:

  - The values [EVALUATION_COUNT,ERROR_RATE,RESPONSE_TIME] on the enum `metric_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `alert_conditions` on the `metrics` table. All the data in the column will be lost.
  - You are about to drop the `flag_evaluations_metrics` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `aggregation_method` to the `metrics` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "metric_aggregation_method" AS ENUM ('SUM', 'AVERAGE', 'P99', 'P90', 'P95', 'P75', 'P50');

-- CreateEnum
CREATE TYPE "metric_event_type" AS ENUM ('COUNT_INCREMENT', 'NUMERIC_VALUE', 'CONVERSION_ENCOUNTER', 'CONVERSION_SUCCESS');

-- CreateEnum
CREATE TYPE "conversion_step_type" AS ENUM ('ENCOUNTER', 'SUCCESS');

-- AlterEnum
BEGIN;
CREATE TYPE "metric_type_new" AS ENUM ('CONVERSION', 'COUNT', 'NUMERIC');
ALTER TABLE "metrics" ALTER COLUMN "metric_type" TYPE "metric_type_new" USING ("metric_type"::text::"metric_type_new");
ALTER TYPE "metric_type" RENAME TO "metric_type_old";
ALTER TYPE "metric_type_new" RENAME TO "metric_type";
DROP TYPE "metric_type_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "flag_evaluations_metrics" DROP CONSTRAINT "flag_evaluations_metrics_flag_evaluation_id_fkey";

-- DropForeignKey
ALTER TABLE "flag_evaluations_metrics" DROP CONSTRAINT "flag_evaluations_metrics_metric_id_fkey";

-- AlterTable
ALTER TABLE "metrics" DROP COLUMN "alert_conditions",
ADD COLUMN     "aggregation_method" "metric_aggregation_method" NOT NULL,
ADD COLUMN     "unit_measurement" TEXT;

-- DropTable
DROP TABLE "flag_evaluations_metrics";

-- CreateTable
CREATE TABLE "metric_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric_id" UUID NOT NULL,
    "metric_key" VARCHAR(255) NOT NULL,
    "part_rollout" BOOLEAN NOT NULL DEFAULT false,
    "variation_served" VARCHAR(255),
    "event_type" "metric_event_type" NOT NULL,
    "numeric_value" DOUBLE PRECISION,
    "conversion_step" "conversion_step_type",
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" JSONB,

    CONSTRAINT "metric_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_aggregations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric_id" UUID NOT NULL,
    "metric_key" VARCHAR(255) NOT NULL,
    "part_rollout" BOOLEAN,
    "variation_served" TEXT,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "window_end" TIMESTAMPTZ(6) NOT NULL,
    "total_events" INTEGER NOT NULL DEFAULT 0,
    "encounters" INTEGER,
    "conversions" INTEGER,
    "conversion_rate" DOUBLE PRECISION,
    "count_total" INTEGER,
    "numeric_sum" DOUBLE PRECISION,
    "numeric_avg" DOUBLE PRECISION,
    "numeric_p50" DOUBLE PRECISION,
    "numeric_p75" DOUBLE PRECISION,
    "numeric_p90" DOUBLE PRECISION,
    "numeric_p95" DOUBLE PRECISION,
    "numeric_p99" DOUBLE PRECISION,
    "numeric_min" DOUBLE PRECISION,
    "numeric_max" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_aggregations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_events_metric_key_timestamp_idx" ON "metric_events"("metric_key", "timestamp");

-- CreateIndex
CREATE INDEX "metric_events_metric_key_event_type_timestamp_idx" ON "metric_events"("metric_key", "event_type", "timestamp");

-- CreateIndex
CREATE INDEX "metric_events_metric_key_part_rollout_variation_served_idx" ON "metric_events"("metric_key", "part_rollout", "variation_served");

-- CreateIndex
CREATE INDEX "metric_aggregations_metric_id_window_start_idx" ON "metric_aggregations"("metric_id", "window_start");

-- CreateIndex
CREATE UNIQUE INDEX "metric_aggregations_metric_id_window_start_window_end_part__key" ON "metric_aggregations"("metric_id", "window_start", "window_end", "part_rollout", "variation_served");

-- AddForeignKey
ALTER TABLE "metric_events" ADD CONSTRAINT "metric_events_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_aggregations" ADD CONSTRAINT "metric_aggregations_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
