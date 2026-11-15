ALTER TABLE `ShippingSettings`
    ADD COLUMN `homeDeliveryEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `branchDeliveryEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `shippingSurcharge` DECIMAL(14, 2) NOT NULL DEFAULT 0;
