// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::{net::SocketAddr, sync::Arc};

use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use serde::{Deserialize, Serialize};
use tokio_util::sync::CancellationToken;
use tracing::info;

use crate::db::{
    models::{AuctionBid, IotaAddress},
    pool::ConnectionPool,
};

#[derive(Clone)]
pub struct ApiState {
    pub pool: Arc<ConnectionPool>,
}

#[derive(Serialize, Deserialize)]
pub struct BidInfo {
    pub domain: String,
    pub bid: i64,
    pub timestamp_ms: i64,
}

pub async fn start_api_server(
    pool: Arc<ConnectionPool>,
    port: u16,
    token: CancellationToken,
) -> anyhow::Result<()> {
    let state = ApiState { pool };

    let app = Router::new()
        .route("/bids/{address}", get(get_bids_for_address))
        .route("/health", get(health_check))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    info!("API server listening on {}", addr);

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

async fn get_bids_for_address(
    State(state): State<ApiState>,
    Path(address_str): Path<String>,
) -> Result<Json<Vec<BidInfo>>, StatusCode> {
    use diesel::prelude::*;

    use crate::db::auction_bids;

    // Parse the address
    let address = match address_str.parse::<iota_types::base_types::IotaAddress>() {
        Ok(addr) => IotaAddress(addr),
        Err(_) => return Err(StatusCode::BAD_REQUEST),
    };

    // Get database connection
    let mut conn = match state.pool.get_connection() {
        Ok(conn) => conn,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Query for bids by this address
    let bids = match auction_bids::dsl::auction_bids
        .filter(auction_bids::dsl::bidder.eq(address))
        .order(auction_bids::dsl::timestamp_ms.desc())
        .load::<AuctionBid>(&mut conn)
    {
        Ok(bids) => bids,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Convert to response format
    let bid_infos: Vec<BidInfo> = bids
        .into_iter()
        .map(|bid| BidInfo {
            domain: bid.domain,
            bid: bid.bid,
            timestamp_ms: bid.timestamp_ms,
        })
        .collect();

    Ok(Json(bid_infos))
}
