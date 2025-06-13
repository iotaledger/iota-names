-- Your SQL goes here
CREATE TABLE `auctions_table`(
	`domain` TEXT NOT NULL PRIMARY KEY,
	`start_timestamp_ms` BIGINT NOT NULL,
	`end_timestamp_ms` BIGINT NOT NULL,
	`starting_bid` BIGINT NOT NULL,
	`bidder` TEXT NOT NULL
);

