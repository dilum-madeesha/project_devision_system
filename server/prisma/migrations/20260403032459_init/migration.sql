-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `epfNumber` INTEGER NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `division` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'SUPERVISOR', 'WORKER', 'HEAD', 'DEPUTY_HEAD', 'PROJECT_MANAGER', 'CHIEF_ENGINEER', 'ENGINEER', 'ASSISTANT_ENGINEER', 'TECHNICAL_OFFICER', 'SECRETARY', 'TRAINEE', 'OTHER') NOT NULL DEFAULT 'WORKER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLogin` DATETIME(3) NULL,
    `privilege` INTEGER NOT NULL DEFAULT 5,
    `profileImageUrl` VARCHAR(191) NULL,
    `profileImagePublicId` VARCHAR(191) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_epfNumber_key`(`epfNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobNumber` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('NOT_STARTED', 'ONGOING', 'COMPLETED', 'ON_HOLD', 'CANCELLED') NOT NULL DEFAULT 'ONGOING',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `reqDepartment` VARCHAR(191) NOT NULL,
    `reqDate` DATETIME(3) NOT NULL,
    `projectCode` VARCHAR(191) NOT NULL,
    `budgetAllocation` DOUBLE NULL,
    `assignOfficer` VARCHAR(191) NOT NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jobs_jobNumber_key`(`jobNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `labors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `epfNumber` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `division` VARCHAR(191) NOT NULL,
    `trade` VARCHAR(191) NOT NULL,
    `payGrade` VARCHAR(191) NOT NULL,
    `dayPay` DOUBLE NOT NULL,
    `otPay` DOUBLE NOT NULL,
    `weekendPay` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` INTEGER NOT NULL,

    UNIQUE INDEX `labors_epfNumber_key`(`epfNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `uom` VARCHAR(191) NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_labor_costs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `cost` DOUBLE NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `daily_labor_costs_jobId_date_key`(`jobId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_labor_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dailyLaborCostId` INTEGER NOT NULL,
    `laborId` INTEGER NOT NULL,
    `timeIn` VARCHAR(191) NOT NULL,
    `timeOut` VARCHAR(191) NOT NULL,
    `otHours` DOUBLE NOT NULL DEFAULT 0,
    `regularHours` DOUBLE NOT NULL DEFAULT 0,
    `regularCost` DOUBLE NOT NULL DEFAULT 0,
    `otCost` DOUBLE NOT NULL DEFAULT 0,
    `hasWeekendPay` BOOLEAN NOT NULL DEFAULT false,
    `weekendPayCost` DOUBLE NOT NULL DEFAULT 0,
    `totalCost` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `daily_labor_assignments_dailyLaborCostId_laborId_key`(`dailyLaborCostId`, `laborId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `type` ENUM('MR', 'PR', 'PO', 'GRN', 'STORE', 'OTHER') NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `cost` DOUBLE NOT NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `material_orders_jobId_date_code_key`(`jobId`, `date`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_order_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialOrderId` INTEGER NOT NULL,
    `materialId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `material_order_assignments_materialOrderId_materialId_key`(`materialOrderId`, `materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contractors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
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
    `projectImages` JSON NULL,
    `totalExpense` DOUBLE NOT NULL DEFAULT 0,
    `expenseEntries` JSON NULL,
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
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_labor_costs` ADD CONSTRAINT `daily_labor_costs_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_labor_costs` ADD CONSTRAINT `daily_labor_costs_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_labor_costs` ADD CONSTRAINT `daily_labor_costs_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_labor_assignments` ADD CONSTRAINT `daily_labor_assignments_dailyLaborCostId_fkey` FOREIGN KEY (`dailyLaborCostId`) REFERENCES `daily_labor_costs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_labor_assignments` ADD CONSTRAINT `daily_labor_assignments_laborId_fkey` FOREIGN KEY (`laborId`) REFERENCES `labors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_orders` ADD CONSTRAINT `material_orders_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_orders` ADD CONSTRAINT `material_orders_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_orders` ADD CONSTRAINT `material_orders_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_order_assignments` ADD CONSTRAINT `material_order_assignments_materialOrderId_fkey` FOREIGN KEY (`materialOrderId`) REFERENCES `material_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_order_assignments` ADD CONSTRAINT `material_order_assignments_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_agreementId_fkey` FOREIGN KEY (`agreementId`) REFERENCES `agreements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `contractors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_officers` ADD CONSTRAINT `project_officers_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_officers` ADD CONSTRAINT `project_officers_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `officers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
