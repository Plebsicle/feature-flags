/*
  Warnings:

  - The values [PERCENTAGE] on the enum `flag_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "attribute_data_type" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SEMVER', 'ARRAY');

-- AlterEnum
ALTER TYPE "audit_resource_type" ADD VALUE 'ORGANIZATION_ATTRIBUTE';

-- AlterEnum
BEGIN;
CREATE TYPE "flag_type_new" AS ENUM ('BOOLEAN', 'STRING', 'NUMBER', 'JSON', 'AB_TEST', 'KILL_SWITCH', 'MULTIVARIATE');
ALTER TABLE "feature_flags" ALTER COLUMN "flag_type" TYPE "flag_type_new" USING ("flag_type"::text::"flag_type_new");
ALTER TYPE "flag_type" RENAME TO "flag_type_old";
ALTER TYPE "flag_type_new" RENAME TO "flag_type";
DROP TYPE "flag_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "flag_evaluations" ADD COLUMN     "user_context" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "organization_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "attribute_name" VARCHAR(255) NOT NULL,
    "data_type" "attribute_data_type" NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "default_value" JSONB,
    "validation_rules" JSONB,
    "description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_attributes_organization_id_data_type_idx" ON "organization_attributes"("organization_id", "data_type");

-- CreateIndex
CREATE INDEX "organization_attributes_organization_id_is_custom_idx" ON "organization_attributes"("organization_id", "is_custom");

-- CreateIndex
CREATE UNIQUE INDEX "organization_attributes_organization_id_attribute_name_key" ON "organization_attributes"("organization_id", "attribute_name");

-- AddForeignKey
ALTER TABLE "organization_attributes" ADD CONSTRAINT "organization_attributes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
