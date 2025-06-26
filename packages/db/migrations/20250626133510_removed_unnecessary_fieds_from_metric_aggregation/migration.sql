/*
  Warnings:

  - You are about to drop the column `part_rollout` on the `metric_aggregations` table. All the data in the column will be lost.
  - You are about to drop the column `variation_served` on the `metric_aggregations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[metric_id,window_start,window_end]` on the table `metric_aggregations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "metric_aggregations_metric_id_window_start_window_end_part__key";

-- AlterTable
ALTER TABLE "metric_aggregations" DROP COLUMN "part_rollout",
DROP COLUMN "variation_served";

-- CreateIndex
CREATE UNIQUE INDEX "metric_aggregations_metric_id_window_start_window_end_key" ON "metric_aggregations"("metric_id", "window_start", "window_end");
