/*
  Warnings:

  - A unique constraint covering the columns `[organization_id,killSwitchKey]` on the table `kill_switches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `killSwitchKey` to the `kill_switches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "kill_switches" ADD COLUMN     "killSwitchKey" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "kill_switches_organization_id_killSwitchKey_key" ON "kill_switches"("organization_id", "killSwitchKey");
