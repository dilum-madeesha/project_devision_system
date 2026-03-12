/*
  Warnings:

  - You are about to drop the column `companyNo` on the `contractors` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `contractors_companyNo_key` ON `contractors`;

-- AlterTable
ALTER TABLE `contractors` DROP COLUMN `companyNo`;

-- AlterTable
ALTER TABLE `projects` ADD COLUMN `expenseEntries` JSON NULL,
    ADD COLUMN `revenueEntries` JSON NULL,
    ADD COLUMN `totalExpense` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `totalRevenue` DOUBLE NOT NULL DEFAULT 0;
