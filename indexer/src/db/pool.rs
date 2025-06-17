// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::time::Duration;

use anyhow::{Result, anyhow};
use clap::Args;
use diesel::{
    SqliteConnection,
    connection::SimpleConnection,
    r2d2::{ConnectionManager, Pool, PooledConnection},
    sqlite::Sqlite,
};
use diesel_migrations::MigrationHarness;

use crate::db::{AUCTIONS_DB_FILENAME, MIGRATIONS};

pub type PoolConnection = PooledConnection<ConnectionManager<SqliteConnection>>;

#[derive(Args, Debug, Clone)]
pub struct DbConnectionPoolConfig {
    #[arg(long, default_value_t = 20)]
    pub pool_size: u32,
    #[arg(long, value_parser = parse_duration, default_value = "30")]
    pub connection_timeout_secs: Duration,
    /// Enable WAL mode in the database.
    #[arg(long)]
    pub enable_wal: bool,
}

fn parse_duration(arg: &str) -> Result<std::time::Duration, std::num::ParseIntError> {
    let seconds = arg.parse()?;
    Ok(std::time::Duration::from_secs(seconds))
}

#[allow(dead_code)]
impl DbConnectionPoolConfig {
    const DEFAULT_POOL_SIZE: u32 = 20;
    const DEFAULT_CONNECTION_TIMEOUT_SECS: u64 = 30;

    pub fn set_pool_size(&mut self, size: u32) {
        self.pool_size = size;
    }

    pub fn set_connection_timeout(&mut self, timeout: Duration) {
        self.connection_timeout_secs = timeout;
    }
}

impl Default for DbConnectionPoolConfig {
    fn default() -> Self {
        Self {
            pool_size: Self::DEFAULT_POOL_SIZE,
            connection_timeout_secs: Duration::from_secs(Self::DEFAULT_CONNECTION_TIMEOUT_SECS),
            enable_wal: false,
        }
    }
}

/// Configure custom PRAGMA statements.
///
/// Adapted from: https://stackoverflow.com/a/57717533
///
/// See more in: https://www.sqlite.org/pragma.html
impl diesel::r2d2::CustomizeConnection<SqliteConnection, diesel::r2d2::Error>
    for DbConnectionPoolConfig
{
    fn on_acquire(&self, conn: &mut SqliteConnection) -> Result<(), diesel::r2d2::Error> {
        (|| {
            conn.batch_execute("PRAGMA foreign_keys = ON;")?;
            conn.batch_execute(&format!(
                "PRAGMA busy_timeout = {};",
                self.connection_timeout_secs.as_millis()
            ))?;
            if self.enable_wal {
                conn.batch_execute("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;")?;
            }
            Ok(())
        })()
        .map_err(diesel::r2d2::Error::QueryError)
    }
}

/// Newtype to represent the connection pool.
///
/// Uses [`Arc`][`std::sync::Arc`] internally.
#[derive(Debug, Clone)]
pub struct DbConnectionPool(Pool<ConnectionManager<SqliteConnection>>);

impl DbConnectionPool {
    /// Build a new pool of connections.
    ///
    /// Resolves the filename URL from the environment.
    pub fn new(pool_config: DbConnectionPoolConfig) -> Result<Self> {
        Self::new_with_url(AUCTIONS_DB_FILENAME, pool_config)
    }

    /// Build a new pool of connections to the given URL.
    pub fn new_with_url(db_url: &str, pool_config: DbConnectionPoolConfig) -> Result<Self> {
        let manager = ConnectionManager::new(db_url);

        Ok(Self(
            Pool::builder()
                .max_size(pool_config.pool_size)
                .connection_timeout(pool_config.connection_timeout_secs)
                .connection_customizer(Box::new(pool_config))
                .build(manager)
                .map_err(|e| {
                    anyhow!("failed to initialize connection pool for {db_url} with error: {e:?}")
                })?,
        ))
    }

    /// Get a connection from the pool.
    pub fn get_connection(&self) -> Result<PoolConnection> {
        self.0.get().map_err(|e| {
            anyhow!("failed to get connection from PG connection pool with error: {e:?}",)
        })
    }
    /// Run pending migrations.
    pub fn run_migrations(&self) -> Result<()> {
        run_migrations(&mut self.get_connection()?)
    }
}

/// Run any pending migrations to the connected database.
pub fn run_migrations(connection: &mut impl MigrationHarness<Sqlite>) -> Result<()> {
    connection
        .run_pending_migrations(MIGRATIONS)
        .map_err(|e| anyhow!("failed to run migrations {e}"))?;

    Ok(())
}
