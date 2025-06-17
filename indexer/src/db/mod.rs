// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

pub mod models;
pub mod pool;
pub mod queries;

use diesel_migrations::{EmbeddedMigrations, embed_migrations};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");
// The filename for the sqlite database.
pub const AUCTIONS_DB_FILENAME: &str = "AUCTIONS_DB";
