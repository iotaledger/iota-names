// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

pub mod models;
pub mod pool;
pub mod queries;

use diesel_migrations::{EmbeddedMigrations, embed_migrations};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");
pub const AUCTION_DB_URL: &str = "AUCTIONS_DB";
