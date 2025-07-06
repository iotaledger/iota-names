// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Core configuration of the IOTA-Names application.
///
/// This configuration is used to validate names for registration and renewal.
/// It can only be stored as a valid config in the `IotaNames` object by an admin,
/// hence why all the functions are public. Having just the config object cannot
/// pose a security risk as it cannot be used.
module iota_names::core_config;

use iota::vec_map::VecMap;
use iota::vec_set::{Self, VecSet};
use iota_names::name::Name;
use std::string::String;

#[error]
const EInvalidLength: vector<u8> = b"Invalid length for the label part of the name.";

#[error]
const EInvalidTln: vector<u8> = b"Invalid TLN";

#[error]
const ESubnameNotSupported: vector<u8> = b"Subnames are not supported for sales.";

public struct CoreConfig has copy, drop, store {
    /// Minimum length of the label part of the name. This is different from
    /// the base `name` checks. This is our minimum acceptable length (for sales).
    min_label_length: u8,
    /// Maximum length of the label part of the name.
    max_label_length: u8,
    /// List of valid TLNs for registration / renewals.
    valid_tlns: VecSet<String>,
    /// The `PaymentIntent` version that can be used for handling sales.
    payments_version: u8,
    /// Maximum number of years available for a name.
    max_years: u8,
    /// List of valid user data keys.
    valid_user_data_keys: VecSet<String>,
    // Extra fields for future use.
    extra: VecMap<String, String>,
}

public fun new(
    min_label_length: u8,
    max_label_length: u8,
    payments_version: u8,
    max_years: u8,
    valid_tlns: vector<String>,
    valid_user_data_keys: vector<String>,
    extra: VecMap<String, String>,
): CoreConfig {
    CoreConfig {
        min_label_length,
        max_label_length,
        payments_version,
        max_years,
        valid_tlns: vec_set::from_keys(valid_tlns),
        valid_user_data_keys: vec_set::from_keys(valid_user_data_keys),
        extra,
    }
}

public fun min_label_length(config: &CoreConfig): u8 {
    config.min_label_length
}

public fun max_label_length(config: &CoreConfig): u8 {
    config.max_label_length
}

public fun is_valid_tln(config: &CoreConfig, tln: &String): bool {
    config.valid_tlns.contains(tln)
}

public fun payments_version(config: &CoreConfig): u8 {
    config.payments_version
}

public fun max_years(config: &CoreConfig): u8 {
    config.max_years
}

public fun is_valid_user_data_key(config: &CoreConfig, user_data_key: &String): bool {
    config.valid_user_data_keys.contains(user_data_key)
}

public fun add_user_data_key(config: &mut CoreConfig, user_data_key: String) {
    config.valid_user_data_keys.insert(user_data_key)
}

/// Validates name against core configuration rules (length, TLN, subname restrictions).
/// Does NOT check deny list - use validation::assert_is_valid_for_sale for complete validation.
public fun assert_is_valid_for_sale(config: &CoreConfig, name: &Name) {
    assert!(!name.is_subname(), ESubnameNotSupported);
    assert!(config.is_valid_tln(name.tln()), EInvalidTln);

    let sln_len = name.sln().length();
    assert!(
        sln_len >= (config.min_label_length as u64) && sln_len <= (config.max_label_length as u64),
        EInvalidLength,
    );
}

#[test_only]
public fun default(): CoreConfig {
    new(
        3,
        63,
        iota_names::constants::payments_version!(),
        5,
        vector[iota_names::constants::iota_tln()],
        valid_user_data_key(),
        iota::vec_map::empty(),
    )
}

#[test_only]
use std::string::utf8;

#[test_only]
public fun valid_user_data_key() : vector<String> {
    vector[
        utf8(b"avatar"),
        utf8(b"twitter/x"),
        utf8(b"discord"),
        utf8(b"github"),
        utf8(b"email"),
        utf8(b"btc"),
        utf8(b"eth"),
        utf8(b"ltc"),
        utf8(b"doge"),
        utf8(b"sol"),
        utf8(b"sui"),
        utf8(b"website"),
        utf8(b"ipfs"),
        utf8(b"arweave"),
    ]
}