/*
  Warnings:

  - A unique constraint covering the columns `[owner_id]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `user_organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "organizations_owner_id_idx";

-- DropIndex
DROP INDEX "user_organizations_user_id_organization_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "organizations_owner_id_key" ON "organizations"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_user_id_key" ON "user_organizations"("user_id");
