/*
  Warnings:

  - You are about to drop the column `value` on the `flag_rules` table. All the data in the column will be lost.
  - Added the required column `default_value` to the `feature_flags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `feature_flags` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feature_flags" ADD COLUMN     "default_value" JSONB NOT NULL,
ADD COLUMN     "value" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "flag_rules" DROP COLUMN "value";
