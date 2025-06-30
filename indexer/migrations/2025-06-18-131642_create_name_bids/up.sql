-- Your SQL goes here
CREATE TABLE `name_bids`(
	`name_id` INTEGER NOT NULL,
	`bids` INTEGER NOT NULL,
	PRIMARY KEY (`name_id`),
	FOREIGN KEY (`name_id`) REFERENCES `names`(`id`)
);
