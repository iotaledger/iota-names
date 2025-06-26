-- Your SQL goes here
CREATE TABLE `domain_bids`(
	`domain_id` INTEGER NOT NULL,
	`bids` INTEGER NOT NULL,
	PRIMARY KEY (`domain_id`),
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`)
);
