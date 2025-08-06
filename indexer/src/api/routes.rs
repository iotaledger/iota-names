// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use axum::{
    Router,
    extract::{Path, State},
    routing::get,
};
use iota_types::base_types::IotaAddress;
use tower_http::cors::{Any, CorsLayer};

use crate::{
    api::{
        ApiState,
        error::ApiError,
        extractors::{AuctionsPagination, BidderNamesPagination},
        responses::AuctionsResponse,
    },
    db::queries,
};

pub fn routes() -> Router<ApiState> {
    Router::new()
        .route("/health", get(health_check))
        .route("/auctions", get(get_auctions))
        .route("/auctions/{address}", get(get_names_for_address))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
}

async fn health_check() -> &'static str {
    "OK"
}

async fn get_names_for_address(
    State(state): State<ApiState>,
    Path(address_str): Path<String>,
    BidderNamesPagination {
        page,
        page_size,
        sort,
    }: BidderNamesPagination,
) -> Result<AuctionsResponse, ApiError> {
    IotaAddress::from_str(&address_str)
        .map_err(|_| ApiError::BadRequest("Invalid IOTA address".to_string()))?;

    let mut conn = state.pool.get_connection()?;
    let mut total_items = 0;
    let names = if let Some(bidder) = queries::get_bidder_by_address(&mut conn, &address_str)? {
        total_items = queries::get_names_for_bidder_count(&mut conn, bidder.id)?;

        if total_items > 0 {
            queries::get_names_for_bidder(&mut conn, bidder.id, page, page_size, sort)?
        } else {
            Default::default()
        }
    } else {
        Default::default()
    };

    Ok(AuctionsResponse {
        names,
        page: page.unwrap_or_default(),
        page_size,
        total_items,
    })
}

async fn get_auctions(
    State(state): State<ApiState>,
    AuctionsPagination {
        page,
        page_size,
        sort,
        sort_by,
        search,
    }: AuctionsPagination,
) -> Result<AuctionsResponse, ApiError> {
    let mut conn = state.pool.get_connection()?;
    let total_items = queries::get_auctions_count(&mut conn, search.as_deref())?;
    let names = if total_items > 0 {
        queries::get_auctions(&mut conn, page, page_size, sort, sort_by, search.as_deref())?
    } else {
        Default::default()
    };

    Ok(AuctionsResponse {
        names,
        page: page.unwrap_or_default(),
        page_size,
        total_items,
    })
}
