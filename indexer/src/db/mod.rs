// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

//! Database for auctions

pub mod models;
pub mod pool;

use diesel_migrations::{EmbeddedMigrations, embed_migrations};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");
pub const AUCTION_DB_URL: &str = "AUCTIONS_DB";

diesel::table! {
    auctions_table (domain) {
        domain -> Text,
        start_timestamp_ms-> BigInt,
        end_timestamp_ms -> BigInt,
        starting_bid -> BigInt,
        bidder -> Binary,
    }
}
