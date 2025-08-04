// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use axum::extract::{FromRequestParts, Query};
use serde::Deserialize;

use crate::{
    api::error::ApiError,
    db::{AuctionSortBy, SortOrder},
};

const DEFAULT_PAGE_SIZE: usize = 50;
const MAX_PAGE_SIZE: usize = 100;

pub struct BidderNamesPagination {
    pub page: Option<usize>,
    pub page_size: usize,
    pub sort: SortOrder,
}

impl<S: Send + Sync> FromRequestParts<S> for BidderNamesPagination {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        #[derive(Clone, Deserialize, Default)]
        #[serde(default, deny_unknown_fields, rename_all = "camelCase")]
        struct BidderNamesPaginationQuery {
            page: Option<usize>,
            page_size: Option<usize>,
            sort: Option<String>,
        }

        let Query(query) = Query::<BidderNamesPaginationQuery>::from_request_parts(parts, state)
            .await
            .map_err(|e| ApiError::BadRequest(e.to_string()))?;

        let sort = query
            .sort
            .as_deref()
            .map_or(Ok(Default::default()), str::parse)
            .map_err(|e: anyhow::Error| ApiError::BadRequest(e.to_string()))?;

        Ok(Self {
            page: query.page,
            page_size: query
                .page_size
                .unwrap_or(DEFAULT_PAGE_SIZE)
                .min(MAX_PAGE_SIZE),
            sort,
        })
    }
}

pub struct AuctionsPagination {
    pub page: Option<usize>,
    pub page_size: usize,
    pub sort: SortOrder,
    pub sort_by: AuctionSortBy,
    pub search: Option<String>,
}

impl<S: Send + Sync> FromRequestParts<S> for AuctionsPagination {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        #[derive(Clone, Deserialize, Default)]
        #[serde(default, deny_unknown_fields, rename_all = "camelCase")]
        struct AuctionsPaginationQuery {
            page: Option<usize>,
            page_size: Option<usize>,
            sort: Option<String>,
            sort_by: Option<String>,
            search: Option<String>,
        }

        let Query(query) = Query::<AuctionsPaginationQuery>::from_request_parts(parts, state)
            .await
            .map_err(|e| ApiError::BadRequest(e.to_string()))?;

        let sort = query
            .sort
            .as_deref()
            .map_or(Ok(Default::default()), str::parse)
            .map_err(|e: anyhow::Error| ApiError::BadRequest(e.to_string()))?;

        let sort_by = query
            .sort_by
            .as_deref()
            .map_or(Ok(Default::default()), str::parse)
            .map_err(|e: anyhow::Error| ApiError::BadRequest(e.to_string()))?;

        Ok(Self {
            page: query.page,
            page_size: query
                .page_size
                .unwrap_or(DEFAULT_PAGE_SIZE)
                .min(MAX_PAGE_SIZE),
            sort,
            sort_by,
            search: query.search,
        })
    }
}
