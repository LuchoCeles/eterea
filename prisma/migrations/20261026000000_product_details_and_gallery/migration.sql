ALTER TABLE `Product` ADD COLUMN `description` TEXT NULL;

CREATE TABLE `ProductImage` (
  `productId` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL,
  `url` TEXT NOT NULL,
  PRIMARY KEY (`productId`, `position`),
  CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProductSize` (
  `productId` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL,
  `label` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`productId`, `position`),
  CONSTRAINT `ProductSize_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProductColor` (
  `productId` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL,
  `label` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`productId`, `position`),
  CONSTRAINT `ProductColor_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CloudinaryPendingUpload` (
  `publicId` VARCHAR(191) NOT NULL,
  `url` VARCHAR(512) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`publicId`),
  UNIQUE INDEX `CloudinaryPendingUpload_url_key` (`url`),
  INDEX `CloudinaryPendingUpload_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ProductImage` (`productId`, `position`, `url`)
SELECT `id`, 0, `image` FROM `Product` WHERE `image` <> '';
