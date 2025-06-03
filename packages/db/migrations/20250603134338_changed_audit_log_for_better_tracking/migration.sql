/*
  Warnings:

  - You are about to drop the column `field_changed` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `new_value` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `old_value` on the `audit_logs` table. All the data in the column will be lost.
  - Added the required column `attributes_changed` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "field_changed",
DROP COLUMN "new_value",
DROP COLUMN "old_value",
ADD COLUMN     "attributes_changed" JSONB NOT NULL;
