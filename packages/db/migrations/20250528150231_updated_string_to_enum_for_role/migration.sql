/*
  Warnings:

  - The `role` column on the `invitations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `user_organizations` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "role",
ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "user_organizations" DROP COLUMN "role",
ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE INDEX "idx_user_organizations_org_role" ON "user_organizations"("organization_id", "role");
