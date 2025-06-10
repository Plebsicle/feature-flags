/*
  Warnings:

  - The values [KILL_SWITCH] on the enum `audit_resource_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "audit_resource_type_new" AS ENUM ('KILL_SWITCHES', 'KILL_SWITCH_FLAG', 'FEATURE_FLAG', 'FLAG_ENVIRONMENT', 'FLAG_RULE', 'ORGANIZATION_ATTRIBUTE', 'FLAG_ROLLOUT');
ALTER TABLE "audit_logs" ALTER COLUMN "resource_type" TYPE "audit_resource_type_new" USING ("resource_type"::text::"audit_resource_type_new");
ALTER TYPE "audit_resource_type" RENAME TO "audit_resource_type_old";
ALTER TYPE "audit_resource_type_new" RENAME TO "audit_resource_type";
DROP TYPE "audit_resource_type_old";
COMMIT;
