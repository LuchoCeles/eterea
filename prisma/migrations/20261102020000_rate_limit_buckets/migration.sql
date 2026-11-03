CREATE TABLE `RateLimitBucket` (
  `bucketKey` VARCHAR(191) NOT NULL,
  `attemptCount` INTEGER NOT NULL,
  `resetAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`bucketKey`)
);
