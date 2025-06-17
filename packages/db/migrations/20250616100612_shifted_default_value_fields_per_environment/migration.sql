/*
  Warnings:

  - You are about to drop the column `default_value` on the `feature_flags` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `feature_flags` table. All the data in the column will be lost.
  - Added the required column `default_value` to the `flag_environments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `flag_environments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feature_flags" DROP COLUMN "default_value",
DROP COLUMN "value";

-- AlterTable
ALTER TABLE "flag_environments" ADD COLUMN     "default_value" JSONB NOT NULL,
ADD COLUMN     "value" JSONB NOT NULL;
