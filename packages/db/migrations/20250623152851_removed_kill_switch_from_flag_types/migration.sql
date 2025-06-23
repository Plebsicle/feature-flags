/*
  Warnings:

  - The values [KILL_SWITCH] on the enum `flag_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "flag_type_new" AS ENUM ('BOOLEAN', 'STRING', 'NUMBER', 'JSON', 'AB_TEST', 'MULTIVARIATE');
ALTER TABLE "feature_flags" ALTER COLUMN "flag_type" TYPE "flag_type_new" USING ("flag_type"::text::"flag_type_new");
ALTER TYPE "flag_type" RENAME TO "flag_type_old";
ALTER TYPE "flag_type_new" RENAME TO "flag_type";
DROP TYPE "flag_type_old";
COMMIT;
