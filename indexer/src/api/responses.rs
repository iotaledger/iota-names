// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuctionsResponse {
    pub names: Vec<String>,
    pub page: usize,
    pub page_size: usize,
    pub total_items: usize,
}

impl axum::response::IntoResponse for AuctionsResponse {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self).into_response()
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockStringResponse {
    pub success: bool,
    pub message: String,
}

impl axum::response::IntoResponse for BlockStringResponse {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self).into_response()
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockedStringsResponse {
    pub blocked_strings: Vec<String>,
}

impl axum::response::IntoResponse for BlockedStringsResponse {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self).into_response()
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockedStringDetail {
    pub id: i32,
    pub blocked_string: String,
    pub match_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetailedBlockedStringsResponse {
    pub blocked_strings: Vec<BlockedStringDetail>,
}

impl axum::response::IntoResponse for DetailedBlockedStringsResponse {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self).into_response()
    }
}
