CREATE TABLE `HowToBuySettings` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `eyebrow` TEXT NOT NULL,
  `title` TEXT NOT NULL,
  `firstStepTitle` TEXT NOT NULL,
  `firstStepDescription` TEXT NOT NULL,
  `secondStepTitle` TEXT NOT NULL,
  `secondStepDescription` TEXT NOT NULL,
  `noticeTitle` TEXT NOT NULL,
  `noticeText` TEXT NOT NULL,

  PRIMARY KEY (`id`)
);
