-- CreateTable
CREATE TABLE "AB_multivariate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_environment_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "variations" JSONB NOT NULL,
    "default_variation" JSONB NOT NULL,
    "rollout_config" JSONB NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AB_multivariate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AB_multivariate_flag_environment_id_key" ON "AB_multivariate"("flag_environment_id");

-- AddForeignKey
ALTER TABLE "AB_multivariate" ADD CONSTRAINT "AB_multivariate_flag_environment_id_fkey" FOREIGN KEY ("flag_environment_id") REFERENCES "flag_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
