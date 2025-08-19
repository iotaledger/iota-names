-- Your SQL goes here
CREATE TABLE `auctions`(
	`name_id` INTEGER NOT NULL,
    `expiration_timestamp` INTEGER NOT NULL,
    `claimed` BOOLEAN NOT NULL,
	PRIMARY KEY (`name_id`),
	FOREIGN KEY (`name_id`) REFERENCES `names`(`id`)
);
