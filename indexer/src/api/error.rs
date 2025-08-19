// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use axum::{
    Json,
    response::{IntoResponse, Response},
};
use reqwest::StatusCode;

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
