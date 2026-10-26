ALTER TABLE `UserRole` MODIFY COLUMN `role` ENUM('admin', 'owner') NOT NULL;

-- Conserva todos los administradores y asigna la propiedad a la cuenta más antigua.
INSERT INTO `UserRole` (`id`, `userId`, `role`, `createdAt`)
SELECT UUID(), `firstAdmin`.`userId`, 'owner', CURRENT_TIMESTAMP(3)
FROM (
  SELECT `ur`.`userId`
  FROM `UserRole` AS `ur`
  INNER JOIN `User` AS `u` ON `u`.`id` = `ur`.`userId`
  WHERE `ur`.`role` = 'admin'
  ORDER BY `u`.`createdAt`, `u`.`id`
  LIMIT 1
) AS `firstAdmin`
WHERE NOT EXISTS (SELECT 1 FROM `UserRole` WHERE `role` = 'owner');
