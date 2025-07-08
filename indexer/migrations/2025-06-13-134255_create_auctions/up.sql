-- Your SQL goes here
CREATE TABLE `names`(
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`name` TEXT NOT NULL UNIQUE
);

CREATE TABLE `bidders`(
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`address` TEXT NOT NULL UNIQUE
);

CREATE TABLE `bidder_name`(
	`bidder_id` INTEGER NOT NULL,
	`name_id` INTEGER NOT NULL,
	PRIMARY KEY (`bidder_id`, `name_id`),
	FOREIGN KEY (`bidder_id`) REFERENCES `bidders`(`id`),
	FOREIGN KEY (`name_id`) REFERENCES `names`(`id`)
);
