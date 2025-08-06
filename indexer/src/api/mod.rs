// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::net::SocketAddr;

use tokio_util::sync::CancellationToken;
use tracing::info;

use crate::db::pool::DbConnectionPool;

mod error;
mod extractors;
mod responses;
mod routes;

#[derive(Clone)]
pub struct ApiState {
    pub pool: DbConnectionPool,
}

pub async fn start_api_server(
    pool: DbConnectionPool,
    port: u16,
    token: CancellationToken,
) -> anyhow::Result<()> {
    let state = ApiState { pool };

    let app = routes::routes().with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    info!("API server listening on {addr}");

    tokio::select! {
        result = axum::serve(listener, app) => {
            if let Err(e) = result {
                tracing::error!("API server error: {e}");
            }
        }
        _ = token.cancelled() => {
            info!("API server shutting down");
        }
    }

    Ok(())
}
