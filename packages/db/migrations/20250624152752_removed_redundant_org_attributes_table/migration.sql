/*
  Warnings:

  - You are about to drop the `organization_attributes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "organization_attributes" DROP CONSTRAINT "organization_attributes_organization_id_fkey";

-- DropTable
DROP TABLE "organization_attributes";
