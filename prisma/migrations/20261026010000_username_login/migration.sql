ALTER TABLE `User` DROP INDEX `User_email_key`;

ALTER TABLE `User` CHANGE COLUMN `email` `username` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `User_username_key` ON `User` (`username`);

ALTER TABLE `UserRole` MODIFY COLUMN `role` ENUM('admin') NOT NULL;
