/*
  Warnings:

  - You are about to drop the `AB_multivariate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AB_multivariate" DROP CONSTRAINT "AB_multivariate_flag_environment_id_fkey";

-- DropTable
DROP TABLE "AB_multivariate";
