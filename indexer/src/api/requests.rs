// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockStringRequest {
    pub string: String,
    #[serde(default = "default_match_type")]
    pub match_type: String, // "full" or "substring"
}

fn default_match_type() -> String {
    "full".to_string()
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnblockStringRequest {
    pub string: String,
}
