-- Your SQL goes here
CREATE TABLE `domains`(
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`name` TEXT NOT NULL UNIQUE
);

CREATE TABLE `bidders`(
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`address` TEXT NOT NULL UNIQUE
);

CREATE TABLE `bidder_domain`(
	`bidder_id` INTEGER NOT NULL,
	`domain_id` INTEGER NOT NULL,
	PRIMARY KEY(`bidder_id`, `domain_id`),
	FOREIGN KEY (`bidder_id`) REFERENCES `bidders`(`id`),
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`)
);

CREATE TABLE `domain_bids`(
	`domain_id` INTEGER NOT NULL,
	`bids` INTEGER NOT NULL,
	PRIMARY KEY(`domain_id`)
);
