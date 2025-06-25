// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::{net::SocketAddr, str::FromStr};

use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json, Response},
    routing::get,
};
use tower_http::cors::{CorsLayer, Any};
use iota_types::base_types::IotaAddress;
use tokio_util::sync::CancellationToken;
use tracing::info;

use crate::db::{pool::DbConnectionPool, queries::get_domains_for_bidder_address};

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

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/auctions/{address}", get(get_domains_for_address))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
        )
        .with_state(state);

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

async fn health_check() -> &'static str {
    "OK"
}

async fn get_domains_for_address(
    State(state): State<ApiState>,
    Path(address_str): Path<String>,
) -> Result<Json<Vec<String>>, ApiError> {
    IotaAddress::from_str(&address_str)
        .map_err(|_| ApiError::BadRequest("Invalid IOTA address".to_string()))?;

    let mut conn = state.pool.get_connection()?;
    let domains = get_domains_for_bidder_address(&mut conn, &address_str)?;

    Ok(Json(domains))
}

#[derive(Debug)]
pub enum ApiError {
    // Invalid input data (e.g., malformed address)
    BadRequest(String),
    // Database connection or query errors
    Database(anyhow::Error),
    // Internal server errors
    Internal(anyhow::Error),
}

// Tell axum how to convert `ApiError` into a response.
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        tracing::error!("{self:?}");
        let (status, json_body) = match self {
            ApiError::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": "Bad Request",
                    "message": msg
                })),
            ),
            ApiError::Database(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Database Error",
                    "message": err.to_string()
                })),
            ),
            ApiError::Internal(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Internal Server Error",
                    "message": err.to_string()
                })),
            ),
        };

        (status, json_body).into_response()
    }
}

// Convert anyhow::Error to ApiError::Internal by default
impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        ApiError::Internal(err)
    }
}

// Convert database errors specifically
impl From<diesel::result::Error> for ApiError {
    fn from(err: diesel::result::Error) -> Self {
        ApiError::Database(err.into())
    }
}
