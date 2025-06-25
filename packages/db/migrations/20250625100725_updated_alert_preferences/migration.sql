/*
  Warnings:

  - You are about to drop the column `alert_notification_frequency` on the `alert_preferences` table. All the data in the column will be lost.
  - Added the required column `frequency_unit` to the `alert_preferences` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency_value` to the `alert_preferences` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number_of_times` to the `alert_preferences` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FrequencyUnit" AS ENUM ('MINUTES', 'HOURS', 'DAYS');

-- AlterTable
ALTER TABLE "alert_preferences" DROP COLUMN "alert_notification_frequency",
ADD COLUMN     "frequency_unit" "FrequencyUnit" NOT NULL,
ADD COLUMN     "frequency_value" INTEGER NOT NULL,
ADD COLUMN     "number_of_times" INTEGER NOT NULL;
