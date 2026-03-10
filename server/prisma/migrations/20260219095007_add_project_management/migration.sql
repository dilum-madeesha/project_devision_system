-- CreateTable
CREATE TABLE `contractors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyNo` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `registrationNo` VARCHAR(191) NOT NULL,
    `specialization` VARCHAR(191) NULL,
    `experienceYears` INTEGER NULL,
    `branches` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contractors_companyNo_key`(`companyNo`),
    UNIQUE INDEX `contractors_registrationNo_key`(`registrationNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `officers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `officerNo` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `contactNumber` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `division` VARCHAR(191) NOT NULL,
    `qualification` VARCHAR(191) NULL,
    `experience` INTEGER NOT NULL DEFAULT 0,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `officers_officerNo_key`(`officerNo`),
    UNIQUE INDEX `officers_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agreements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agreementNo` VARCHAR(191) NOT NULL,
    `agreementID` VARCHAR(191) NULL,
    `projectName` VARCHAR(191) NOT NULL,
    `agreementSum` DOUBLE NOT NULL,
    `vat` DOUBLE NULL DEFAULT 0,
    `periodDays` INTEGER NULL,
    `awardDate` DATETIME(3) NULL,
    `startDate` DATETIME(3) NULL,
    `completionDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
    `description` VARCHAR(191) NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agreements_agreementNo_key`(`agreementNo`),
    UNIQUE INDEX `agreements_agreementID_key`(`agreementID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` VARCHAR(191) NOT NULL,
    `projectName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNING',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `completedPercent` INTEGER NOT NULL DEFAULT 0,
    `agreementId` INTEGER NULL,
    `contractorId` INTEGER NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projects_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_officers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `officerId` INTEGER NOT NULL,
    `role` ENUM('ENGINEER', 'TECHNICAL_OFFICER', 'SECRETARY') NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `project_officers_projectId_officerId_role_key`(`projectId`, `officerId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_agreementId_fkey` FOREIGN KEY (`agreementId`) REFERENCES `agreements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `contractors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_officers` ADD CONSTRAINT `project_officers_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_officers` ADD CONSTRAINT `project_officers_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `officers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
