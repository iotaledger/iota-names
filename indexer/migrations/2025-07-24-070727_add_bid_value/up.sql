-- Your SQL goes here
CREATE TABLE `bids` (
    `bidder_id` INTEGER NOT NULL,
    `name_id` INTEGER NOT NULL,
    `bid` BIGINT NOT NULL,
    PRIMARY KEY (`name_id`, `bidder_id`, `bid`),
    FOREIGN KEY (`name_id`) REFERENCES `names`(`id`),
    FOREIGN KEY (`bidder_id`) REFERENCES `bidders`(`id`)
);

INSERT INTO `bids` (`bidder_id`, `name_id`, `bid`)
SELECT `bidder_id`, `name_id`, 0
FROM `bidder_name`;

DROP TABLE `bidder_name`;
DROP TABLE `name_bids`;
