/*
  Warnings:

  - You are about to drop the column `duration_end` on the `flag_rollout` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `flag_rules` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "flag_rollout_duration_end_idx";

-- DropIndex
DROP INDEX "flag_rules_flag_environment_id_priority_idx";

-- AlterTable
ALTER TABLE "flag_environments" ALTER COLUMN "is_enabled" SET DEFAULT true;

-- AlterTable
ALTER TABLE "flag_rollout" DROP COLUMN "duration_end";

-- AlterTable
ALTER TABLE "flag_rules" DROP COLUMN "priority";
