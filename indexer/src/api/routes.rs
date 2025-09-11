// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use axum::{
    Json, Router,
    extract::{Path, State},
    middleware::from_extractor,
    routing::get,
};
use iota_types::base_types::IotaAddress;
use tower_http::cors::{Any, CorsLayer};

use crate::{
    api::{
        ApiState,
        auth::Auth,
        error::ApiError,
        extractors::{AuctionsPagination, BidderNamesPagination},
        responses::{
            AuctionsResponse, BlockStringRequest, BlockStringResponse, BlockedStringsResponse,
            UnblockStringRequest,
        },
    },
    db::queries,
};

pub fn routes() -> Router<ApiState> {
    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/auctions", get(get_auctions))
        .route("/auctions/{address}", get(get_auctions_for_address));

    let protected_routes = Router::new().route(
        "/blocked-strings",
        get(get_blocked_strings_list)
            .post(block_string)
            .delete(unblock_string),
    );

    Router::new()
        .merge(public_routes)
        .nest(
            "/admin",
            protected_routes.route_layer(from_extractor::<Auth>()),
        )
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

async fn get_auctions_for_address(
    State(state): State<ApiState>,
    Path(address_str): Path<String>,
    BidderNamesPagination {
        page,
        page_size,
        sort,
        status,
    }: BidderNamesPagination,
) -> Result<AuctionsResponse, ApiError> {
    IotaAddress::from_str(&address_str)
        .map_err(|_| ApiError::BadRequest("Invalid IOTA address".to_string()))?;

    let mut conn = state.pool.get_connection()?;
    let mut total_items = 0;
    let now = chrono::Utc::now();
    let names = if let Some(bidder) = queries::get_bidder_by_address(&mut conn, &address_str)? {
        total_items = queries::get_auctions_for_bidder_count(&mut conn, bidder.id, status, now)?;

        if total_items > 0 {
            queries::get_auctions_for_bidder(
                &mut conn, bidder.id, page, page_size, sort, status, now,
            )?
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
        status,
    }: AuctionsPagination,
) -> Result<AuctionsResponse, ApiError> {
    let mut conn = state.pool.get_connection()?;
    let now = chrono::Utc::now();
    let total_items = queries::get_auctions_count(&mut conn, search.as_deref(), status, now)?;
    let names = if total_items > 0 {
        queries::get_auctions(
            &mut conn,
            page,
            page_size,
            sort,
            sort_by,
            search.as_deref(),
            status,
            now,
        )?
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

// Admin endpoints for blocking/unblocking strings

async fn block_string(
    State(state): State<ApiState>,
    Json(payload): Json<BlockStringRequest>,
) -> Result<BlockStringResponse, ApiError> {
    let mut conn = state.pool.get_connection()?;

    match queries::add_blocked_string(&mut conn, &payload.string) {
        Ok(_) => Ok(BlockStringResponse {
            success: true,
            message: format!("String '{}' has been blocked", payload.string),
        }),
        Err(e) => {
            if let Some(diesel_error) = e.downcast_ref::<diesel::result::Error>() {
                match diesel_error {
                    diesel::result::Error::DatabaseError(
                        diesel::result::DatabaseErrorKind::UniqueViolation,
                        _,
                    ) => Ok(BlockStringResponse {
                        success: false,
                        message: format!("String '{}' is already blocked", payload.string),
                    }),
                    _ => Err(ApiError::Database(e)),
                }
            } else {
                Err(ApiError::Database(e))
            }
        }
    }
}

async fn unblock_string(
    State(state): State<ApiState>,
    Json(payload): Json<UnblockStringRequest>,
) -> Result<BlockStringResponse, ApiError> {
    let mut conn = state.pool.get_connection()?;

    let removed = queries::remove_blocked_string(&mut conn, &payload.string)?;

    if removed {
        Ok(BlockStringResponse {
            success: true,
            message: format!("String '{}' has been unblocked", payload.string),
        })
    } else {
        Ok(BlockStringResponse {
            success: false,
            message: format!("String '{}' was not found in blocked list", payload.string),
        })
    }
}

async fn get_blocked_strings_list(
    State(state): State<ApiState>,
) -> Result<BlockedStringsResponse, ApiError> {
    let mut conn = state.pool.get_connection()?;
    let blocked_strings = queries::get_blocked_strings(&mut conn)?;

    Ok(BlockedStringsResponse { blocked_strings })
}
