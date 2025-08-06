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
