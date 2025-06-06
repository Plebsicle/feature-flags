/*
  Warnings:

  - You are about to drop the column `flag_id` on the `audit_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_flag_id_fkey";

-- DropIndex
DROP INDEX "audit_logs_flag_id_created_at_idx";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "flag_id",
ADD COLUMN     "organisation_id" UUID;

-- CreateIndex
CREATE INDEX "audit_logs_organisation_id_created_at_idx" ON "audit_logs"("organisation_id", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
