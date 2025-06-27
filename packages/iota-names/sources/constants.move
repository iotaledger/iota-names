// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Module to wrap all constants used across the project. A singleton and not
/// meant to be modified (only extended).
///
/// This module is free from any non-framework dependencies and serves as a
/// single place of storing constants and proving convenient APIs for reading.
module iota_names::constants;

use std::string::String;

/// Top level name for IOTA.
const IOTA_TLN: vector<u8> = b"iota";
/// The amount of milliseconds in a year.
const YEAR_MS: u64 = 365 * 24 * 60 * 60 * 1000;
/// 30 day Grace period in milliseconds.
const GRACE_PERIOD_MS: u64 = 30 * 24 * 60 * 60 * 1000;

/// A leaf record doesn't expire. Expiration is retrieved by the parent's
/// expiration.
const LEAF_EXPIRATION_TIMESTAMP: u64 = 0;

/// Subname constants
///
/// These constants are the core of the subname functionality.
/// Even if we decide to change the subname module, these can
/// be re-used. They're added as metadata on NameRecord.
///
/// Whether a parent name can create child names. (name -> subname)
const ALLOW_CREATION: vector<u8> = b"S_AC";
/// Whether a child-name can auto-renew (if the parent hasn't changed).
const ALLOW_TIME_EXTENSION: vector<u8> = b"S_ATE";

// === Public functions ===

/// Top level name for IOTA as a String.
public fun iota_tln(): String { IOTA_TLN.to_string() }

/// The amount of milliseconds in a year.
public fun year_ms(): u64 { YEAR_MS }

/// Grace period in milliseconds after which the name expires.
public fun grace_period_ms(): u64 { GRACE_PERIOD_MS }

/// Subname constants
/// The NameRecord key that a subname can create child names.
public fun subname_allow_creation_key(): String { ALLOW_CREATION.to_string() }

/// The NameRecord key that a subname can self-renew.
public fun subname_allow_extension_key(): String {
    ALLOW_TIME_EXTENSION.to_string()
}

/// A getter for a leaf name record's expiration timestamp.
public fun leaf_expiration_timestamp(): u64 { LEAF_EXPIRATION_TIMESTAMP }

/// The `PaymentIntent` version that can be used by this package for payments.
public macro fun payments_version(): u8 { 1 }
