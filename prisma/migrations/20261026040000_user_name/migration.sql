ALTER TABLE `User`
  ADD COLUMN `name` VARCHAR(100) NOT NULL DEFAULT '';

UPDATE `User`
SET `name` = LEFT(`username`, 100)
WHERE `name` = '';
