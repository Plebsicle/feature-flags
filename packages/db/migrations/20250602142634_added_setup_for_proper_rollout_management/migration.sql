-- CreateEnum
CREATE TYPE "rollout_type" AS ENUM ('PERCENTAGE', 'PROGRESSIVE_ROLLOUT', 'CUSTOM_PROGRESSIVE_ROLLOUT');

-- AlterEnum
ALTER TYPE "audit_resource_type" ADD VALUE 'FLAG_ROLLOUT';

-- CreateTable
CREATE TABLE "flag_rollout" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_environment_id" UUID NOT NULL,
    "type" "rollout_type" NOT NULL,
    "config" JSONB NOT NULL,
    "duration_end" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flag_rollout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flag_rollout_flag_environment_id_key" ON "flag_rollout"("flag_environment_id");

-- CreateIndex
CREATE INDEX "flag_rollout_duration_end_idx" ON "flag_rollout"("duration_end");

-- AddForeignKey
ALTER TABLE "flag_rollout" ADD CONSTRAINT "flag_rollout_flag_environment_id_fkey" FOREIGN KEY ("flag_environment_id") REFERENCES "flag_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
