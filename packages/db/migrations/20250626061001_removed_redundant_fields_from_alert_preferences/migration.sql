/*
  Warnings:

  - You are about to drop the column `frequency_unit` on the `alert_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `frequency_value` on the `alert_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `number_of_times` on the `alert_preferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "alert_preferences" DROP COLUMN "frequency_unit",
DROP COLUMN "frequency_value",
DROP COLUMN "number_of_times";

-- AlterTable
ALTER TABLE "metrics" ALTER COLUMN "aggregation_method" DROP NOT NULL,
ALTER COLUMN "aggregation_method" SET DEFAULT 'AVERAGE';
