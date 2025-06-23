/*
  Warnings:

  - You are about to drop the column `slackIntegrationId` on the `SlackChannel` table. All the data in the column will be lost.
  - You are about to drop the column `authed_user_id` on the `SlackIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `bot_user_id` on the `SlackIntegration` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slack_integration_id,channel_id]` on the table `SlackChannel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[team_id]` on the table `SlackIntegration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slack_integration_id` to the `SlackChannel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scope` to the `SlackIntegration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SlackChannel" DROP CONSTRAINT "SlackChannel_slackIntegrationId_fkey";

-- DropForeignKey
ALTER TABLE "SlackIntegration" DROP CONSTRAINT "SlackIntegration_organisation_id_fkey";

-- AlterTable
ALTER TABLE "SlackChannel" DROP COLUMN "slackIntegrationId",
ADD COLUMN     "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slack_integration_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "SlackIntegration" DROP COLUMN "authed_user_id",
DROP COLUMN "bot_user_id",
ADD COLUMN     "installed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "scope" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "SlackChannel_slack_integration_id_idx" ON "SlackChannel"("slack_integration_id");

-- CreateIndex
CREATE UNIQUE INDEX "SlackChannel_slack_integration_id_channel_id_key" ON "SlackChannel"("slack_integration_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "SlackIntegration_team_id_key" ON "SlackIntegration"("team_id");

-- CreateIndex
CREATE INDEX "SlackIntegration_organisation_id_idx" ON "SlackIntegration"("organisation_id");

-- CreateIndex
CREATE INDEX "SlackIntegration_team_id_idx" ON "SlackIntegration"("team_id");

-- AddForeignKey
ALTER TABLE "SlackIntegration" ADD CONSTRAINT "SlackIntegration_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlackChannel" ADD CONSTRAINT "SlackChannel_slack_integration_id_fkey" FOREIGN KEY ("slack_integration_id") REFERENCES "SlackIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
