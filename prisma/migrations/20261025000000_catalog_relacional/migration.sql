CREATE TABLE `Category` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `hidden` BOOLEAN NOT NULL DEFAULT false,
  `position` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Category_name_key` (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Product` (
  `id` VARCHAR(191) NOT NULL,
  `categoryId` VARCHAR(191) NOT NULL,
  `name` TEXT NOT NULL,
  `price` DECIMAL(14,2) NOT NULL,
  `oldPrice` DECIMAL(14,2) NULL,
  `tag` TEXT NULL,
  `image` TEXT NOT NULL,
  `section` VARCHAR(20) NOT NULL,
  `hidden` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NULL,
  `position` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Product_categoryId_idx` (`categoryId`),
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProductPaymentPrice` (
  `id` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `label` VARCHAR(80) NOT NULL,
  `price` DECIMAL(14,2) NOT NULL,
  `position` INTEGER NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (`id`),
  INDEX `ProductPaymentPrice_productId_idx` (`productId`),
  CONSTRAINT `ProductPaymentPrice_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HomeCategoryCard` (
  `id` VARCHAR(191) NOT NULL,
  `categoryId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NULL,
  `img` TEXT NOT NULL,
  `hidden` BOOLEAN NOT NULL DEFAULT true,
  `position` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `HomeCategoryCard_categoryId_key` (`categoryId`),
  INDEX `HomeCategoryCard_productId_idx` (`productId`),
  CONSTRAINT `HomeCategoryCard_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `HomeCategoryCard_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
