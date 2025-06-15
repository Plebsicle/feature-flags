-- CreateEnum
CREATE TYPE "alert_status" AS ENUM ('TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "alert_operator" AS ENUM ('EQUALS_TO', 'GREATER_THAN', 'LESS_THAN');

-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisation_id" UUID NOT NULL,
    "alert_notification_frequency" TIMESTAMP(3) NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "slack_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_roles_notification" "user_role"[] DEFAULT ARRAY['ADMIN', 'OWNER']::"user_role"[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlackIntegration" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisation_id" UUID NOT NULL,
    "team_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "bot_token" TEXT NOT NULL,
    "authed_user_id" TEXT,
    "bot_user_id" TEXT,

    CONSTRAINT "SlackIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlackChannel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slackIntegrationId" UUID NOT NULL,
    "channel_id" TEXT NOT NULL,
    "channel_name" TEXT NOT NULL,

    CONSTRAINT "SlackChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_metric" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric_id" UUID NOT NULL,
    "operator" "alert_operator" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "alert_metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triggered_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric_id" UUID NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL,
    "threshold_value" DOUBLE PRECISION NOT NULL,
    "alert_status" "alert_status" NOT NULL DEFAULT 'TRIGGERED',
    "resolved_at" TIMESTAMPTZ(6),
    "acknowledged_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triggered_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alert_preferences_organisation_id_key" ON "alert_preferences"("organisation_id");

-- CreateIndex
CREATE UNIQUE INDEX "alert_metric_metric_id_key" ON "alert_metric"("metric_id");

-- AddForeignKey
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlackIntegration" ADD CONSTRAINT "SlackIntegration_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlackChannel" ADD CONSTRAINT "SlackChannel_slackIntegrationId_fkey" FOREIGN KEY ("slackIntegrationId") REFERENCES "SlackIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_metric" ADD CONSTRAINT "alert_metric_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triggered_alerts" ADD CONSTRAINT "triggered_alerts_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
