// Copyright 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use axum::{extract::FromRequestParts, http::request::Parts};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};

use crate::api::error::ApiError;

pub struct Auth;

impl<S: Send + Sync> FromRequestParts<S> for Auth {
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        const ADMIN_API_KEY_ENV: &str = "ADMIN_API_KEY";

        let TypedHeader(Authorization(bearer)) =
            TypedHeader::<Authorization<Bearer>>::from_request_parts(parts, state)
                .await
                .map_err(|_| ApiError::BadRequest("Missing authorization header".to_string()))?;

        let expected_key = std::env::var(ADMIN_API_KEY_ENV)
            .map_err(|_| ApiError::Unauthorized("Admin API key not configured".to_string()))?;

        if bearer.token() != expected_key {
            return Err(ApiError::Unauthorized("Invalid API key".to_string()));
        }

        Ok(Auth)
    }
}
