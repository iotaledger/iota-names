// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Module that contains const metadata keys for the IOTA name service.
module metadata::keys; 

use std::string::{utf8, String};

const IMAGE_URL: vector<u8> = b"IMAGE_URL";
const WEBSITE: vector<u8> = b"WEBSITE";

/// The image URL key
public fun image_url(): String { utf8(IMAGE_URL) }

/// The website key
public fun website(): String { utf8(WEBSITE) }
