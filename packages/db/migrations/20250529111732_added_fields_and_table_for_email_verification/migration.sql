-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "emailVerificationToken" (
    "token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emailVerificationToken_pkey" PRIMARY KEY ("token_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emailVerificationToken_user_id_key" ON "emailVerificationToken"("user_id");

-- CreateIndex
CREATE INDEX "emailVerificationToken_user_id_idx" ON "emailVerificationToken"("user_id");

-- AddForeignKey
ALTER TABLE "emailVerificationToken" ADD CONSTRAINT "emailVerificationToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
