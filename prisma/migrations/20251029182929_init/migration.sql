-- CreateTable
CREATE TABLE `Country` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `capital` VARCHAR(255) NULL,
    `region` VARCHAR(255) NULL,
    `population` BIGINT NOT NULL,
    `currency_code` VARCHAR(10) NULL,
    `exchange_rate` DOUBLE NULL,
    `estimated_gdp` DOUBLE NULL,
    `flag_url` TEXT NULL,
    `last_refreshed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Country_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
