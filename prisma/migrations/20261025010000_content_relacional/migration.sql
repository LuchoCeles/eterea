-- CreateTable
CREATE TABLE `ContentSection` (
    `key` VARCHAR(64) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `whatsapp` VARCHAR(30) NOT NULL DEFAULT '',
    `instagramUsername` VARCHAR(31) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfferSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `showSplit` BOOLEAN NOT NULL DEFAULT false,
    `showClub` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomeSectionSetting` (
    `section` VARCHAR(32) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`section`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SplitBanner` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `kicker` TEXT NOT NULL,
    `big` TEXT NOT NULL,
    `sub` TEXT NOT NULL,
    `cta` TEXT NOT NULL,
    `img` TEXT NOT NULL,
    `productId` VARCHAR(191) NULL,

    INDEX `SplitBanner_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClubBanner` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `kicker` TEXT NOT NULL,
    `big` TEXT NOT NULL,
    `text` TEXT NOT NULL,
    `code` TEXT NOT NULL,
    `cta` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EditorialBanner` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `kicker` TEXT NOT NULL,
    `title` TEXT NOT NULL,
    `text` TEXT NOT NULL,
    `cta` TEXT NOT NULL,
    `img` TEXT NOT NULL,
    `productId` VARCHAR(191) NULL,

    INDEX `EditorialBanner_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromoLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `position` INTEGER NOT NULL,
    `text` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HeroSlide` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `position` INTEGER NOT NULL,
    `img` TEXT NOT NULL,
    `productId` VARCHAR(191) NULL,
    `kicker` TEXT NOT NULL,
    `title` TEXT NOT NULL,
    `cta` TEXT NOT NULL,
    `promo` TEXT NOT NULL,
    `align` VARCHAR(5) NOT NULL,

    INDEX `HeroSlide_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Benefit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `position` INTEGER NOT NULL,
    `title` TEXT NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarqueeLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `position` INTEGER NOT NULL,
    `text` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CuratedInstagramPost` (
    `id` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `url` TEXT NOT NULL,
    `image` TEXT NOT NULL,
    `productId` VARCHAR(191) NULL,
    `title` TEXT NOT NULL,
    `kind` VARCHAR(4) NOT NULL,

    INDEX `CuratedInstagramPost_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CloudinaryCleanup` (
    `url` VARCHAR(512) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`url`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstagramConnection` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `connectionId` VARCHAR(64) NOT NULL,
    `encryptedToken` TEXT NOT NULL,
    `iv` VARCHAR(64) NOT NULL,
    `tag` VARCHAR(64) NOT NULL,
    `nextRefreshAt` DATETIME(3) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `username` VARCHAR(31) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstagramFeedState` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `connectionId` VARCHAR(64) NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstagramFeedPost` (
    `id` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `url` TEXT NOT NULL,
    `image` TEXT NOT NULL,
    `title` TEXT NOT NULL,
    `kind` VARCHAR(4) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstagramMediaState` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `connectionId` VARCHAR(64) NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstagramMediaEntry` (
    `url` VARCHAR(512) NOT NULL,
    `checked` BOOLEAN NOT NULL DEFAULT false,
    `mediaId` VARCHAR(191) NULL,
    `videoUrl` TEXT NULL,
    `imageUrl` TEXT NULL,
    `posterUrl` TEXT NULL,

    PRIMARY KEY (`url`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SplitBanner` ADD CONSTRAINT `SplitBanner_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditorialBanner` ADD CONSTRAINT `EditorialBanner_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeroSlide` ADD CONSTRAINT `HeroSlide_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuratedInstagramPost` ADD CONSTRAINT `CuratedInstagramPost_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

