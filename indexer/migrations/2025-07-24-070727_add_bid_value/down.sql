-- This file should undo anything in `up.sql`
CREATE TABLE `bidder_name`(
	`bidder_id` INTEGER NOT NULL,
	`name_id` INTEGER NOT NULL,
	PRIMARY KEY (`bidder_id`, `name_id`),
	FOREIGN KEY (`bidder_id`) REFERENCES `bidders`(`id`),
	FOREIGN KEY (`name_id`) REFERENCES `names`(`id`)
);

INSERT INTO `bidder_name` (`bidder_id`, `name_id`)
SELECT `bidder_id`, `name_id`
FROM `bids`;

DROP TABLE `bids`;
