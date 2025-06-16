// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

//! Database for auctions

pub mod helpers;
pub mod models;
pub mod pool;

use diesel_migrations::{EmbeddedMigrations, embed_migrations};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");
pub const AUCTION_DB_URL: &str = "AUCTIONS_DB";

diesel::table! {
    domains (id) {
        id -> Int4,
        name -> Text,
    }
}

diesel::table! {
    bidders (id) {
        id -> Int4,
        address -> Text,
    }
}

diesel::table! {
    bidder_domain (bidder_id, domain_id) {
        bidder_id -> Int4,
        domain_id -> Int4,
    }
}

diesel::joinable!(bidder_domain -> domains (domain_id));
diesel::joinable!(bidder_domain -> bidders (bidder_id));

diesel::allow_tables_to_appear_in_same_query!(bidders, domains, bidder_domain,);
