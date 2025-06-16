// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::{net::SocketAddr, sync::Arc};

use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json, Response},
    routing::get,
};
use diesel::{BelongingToDsl, ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper};
use tokio_util::sync::CancellationToken;
use tracing::info;

use crate::db::{
    models::{Bidder, BidderDomain, Domain, bidders, domains},
    pool::ConnectionPool,
};

#[derive(Clone)]
pub struct ApiState {
    pub pool: Arc<ConnectionPool>,
}

pub async fn start_api_server(
    pool: Arc<ConnectionPool>,
    port: u16,
    token: CancellationToken,
) -> anyhow::Result<()> {
    let state = ApiState { pool };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/auctions/{address}", get(get_domains_for_address))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    info!("API server listening on {addr}");

    tokio::select! {
        result = axum::serve(listener, app) => {
            if let Err(e) = result {
                tracing::error!("API server error: {}", e);
            }
        }
        _ = token.cancelled() => {
            info!("API server shutting down");
        }
    }

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}

async fn get_domains_for_address(
    State(state): State<ApiState>,
    Path(address_str): Path<String>,
) -> Result<Json<Vec<String>>, AppError> {
    let mut conn = state.pool.get_connection()?;

    let bidder = bidders::table
        .filter(bidders::address.eq(address_str))
        .select(Bidder::as_select())
        .get_result(&mut conn)?;

    let domains = BidderDomain::belonging_to(&bidder)
        .inner_join(domains::table)
        .select(Domain::as_select())
        .load(&mut conn)?;

    Ok(Json(domains.into_iter().map(|d| d.name).collect()))
}

// Make our own error that wraps `anyhow::Error`.
struct AppError(anyhow::Error);

// Tell axum how to convert `AppError` into a response.
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Something went wrong: {}", self.0),
        )
            .into_response()
    }
}

// This enables using `?` on functions that return `Result<_, anyhow::Error>` to
// turn them into `Result<_, AppError>`. That way you don't need to do that
// manually.
impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}
