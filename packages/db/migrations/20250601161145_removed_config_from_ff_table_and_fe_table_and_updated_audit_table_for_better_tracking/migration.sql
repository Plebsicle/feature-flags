/*
  Warnings:

  - You are about to drop the column `config` on the `feature_flags` table. All the data in the column will be lost.
  - You are about to drop the column `config` on the `flag_environments` table. All the data in the column will be lost.
  - Changed the type of `resource_type` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "audit_resource_type" AS ENUM ('FEATURE_FLAG', 'FLAG_ENVIRONMENT', 'FLAG_RULE');

-- AlterEnum
ALTER TYPE "environment_type" ADD VALUE 'TEST';

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "field_changed" VARCHAR(100),
DROP COLUMN "resource_type",
ADD COLUMN     "resource_type" "audit_resource_type" NOT NULL;

-- AlterTable
ALTER TABLE "feature_flags" DROP COLUMN "config";

-- AlterTable
ALTER TABLE "flag_environments" DROP COLUMN "config";

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_created_at_idx" ON "audit_logs"("resource_type", "created_at");
