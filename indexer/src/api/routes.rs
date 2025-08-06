// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use axum::{
    Json, Router,
    extract::{Path, State},
    routing::get,
};
use iota_types::base_types::IotaAddress;
use tower_http::cors::{Any, CorsLayer};

use crate::api::{
    ApiState,
    error::ApiError,
    extractors::{AuctionsPagination, BidderNamesPagination},
};

pub fn routes() -> Router<ApiState> {
    Router::new()
        .route("/health", get(health_check))
        .route("/auctions", get(get_auctions))
        .route("/auctions/total", get(get_total_auctions))
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
) -> Result<Json<Vec<String>>, ApiError> {
    IotaAddress::from_str(&address_str)
        .map_err(|_| ApiError::BadRequest("Invalid IOTA address".to_string()))?;

    let mut conn = state.pool.get_connection()?;
    let names = crate::db::queries::get_names_for_bidder_address(
        &mut conn,
        &address_str,
        page,
        page_size,
        sort,
    )?;

    Ok(Json(names))
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
) -> Result<Json<Vec<String>>, ApiError> {
    let mut conn = state.pool.get_connection()?;
    let names =
        crate::db::queries::get_auctions(&mut conn, page, page_size, sort, sort_by, search)?;

    Ok(Json(names))
}

async fn get_total_auctions(
    State(state): State<ApiState>,
    AuctionsPagination { search }: AuctionsPagination,
) -> Result<Json<i64>, ApiError> {
    let mut conn = state.pool.get_connection()?;
    let count =
        crate::db::queries::get_total_auctions(&mut conn, page, page_size, sort, sort_by, search)?;

    Ok(Json(count))
}
