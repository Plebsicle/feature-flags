-- AlterEnum
ALTER TYPE "audit_resource_type" ADD VALUE 'KILL_SWITCH';

-- AlterTable
ALTER TABLE "flag_rules" ALTER COLUMN "is_enabled" SET DEFAULT false;

-- CreateTable
CREATE TABLE "kill_switches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMPTZ(6),
    "activated_by" UUID,

    CONSTRAINT "kill_switches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kill_switch_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kill_switch_id" UUID NOT NULL,
    "flag_id" UUID NOT NULL,
    "environments" "environment_type"[] DEFAULT ARRAY[]::"environment_type"[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kill_switch_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kill_switches_organization_id_is_active_idx" ON "kill_switches"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "kill_switches_organization_id_created_at_idx" ON "kill_switches"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "kill_switch_flags_kill_switch_id_flag_id_idx" ON "kill_switch_flags"("kill_switch_id", "flag_id");

-- CreateIndex
CREATE INDEX "kill_switch_flags_flag_id_idx" ON "kill_switch_flags"("flag_id");

-- CreateIndex
CREATE UNIQUE INDEX "kill_switch_flags_kill_switch_id_flag_id_key" ON "kill_switch_flags"("kill_switch_id", "flag_id");

-- AddForeignKey
ALTER TABLE "kill_switches" ADD CONSTRAINT "kill_switches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kill_switches" ADD CONSTRAINT "kill_switches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kill_switches" ADD CONSTRAINT "kill_switches_activated_by_fkey" FOREIGN KEY ("activated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kill_switch_flags" ADD CONSTRAINT "kill_switch_flags_kill_switch_id_fkey" FOREIGN KEY ("kill_switch_id") REFERENCES "kill_switches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kill_switch_flags" ADD CONSTRAINT "kill_switch_flags_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
