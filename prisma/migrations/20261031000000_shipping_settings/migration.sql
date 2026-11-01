CREATE TABLE `ShippingSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `environment` VARCHAR(12) NOT NULL DEFAULT 'production',
    `apiUser` VARCHAR(191) NOT NULL,
    `encryptedPassword` TEXT NOT NULL,
    `passwordIv` VARCHAR(64) NOT NULL,
    `passwordTag` VARCHAR(64) NOT NULL,
    `customerId` VARCHAR(32) NOT NULL,
    `postalCodeOrigin` VARCHAR(4) NOT NULL,
    `itemWeightGrams` INTEGER NOT NULL,
    `packageWeightGrams` INTEGER NOT NULL,
    `itemHeightCm` INTEGER NOT NULL,
    `packageHeightCm` INTEGER NOT NULL,
    `packageWidthCm` INTEGER NOT NULL,
    `packageLengthCm` INTEGER NOT NULL,
    `freeShippingThreshold` DECIMAL(14, 2) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
