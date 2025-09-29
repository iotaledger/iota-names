// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names_subnames::config;

use iota_names::constants::iota_tln;
use iota_names::name::{Name, is_parent_of};
use std::string::String;

/// The minimum size a subname label can have.
const MIN_LABEL_SIZE: u8 = 3;
/// The maximum depth a subname can have -> 8 (+ 2 for TLN, SLN).
const MAX_SUBNAME_DEPTH: u8 = 10;
/// Minimum duration for a subname in milliseconds (1 day).
const MINIMUM_SUBNAME_DURATION: u64 = 24 * 60 * 60 * 1000;

#[error]
const EDepthExceedsLimit: vector<u8> =
    b"Tried to register a subname with a depth more than the one allowed.";
#[error]
const EInvalidParent: vector<u8> =
    b"Tried to register a subname with the wrong parent (based on name).";
#[error]
const EInvalidLabelSize: vector<u8> =
    b"Tried to register a subname containing a label of size less than 3.";
#[error]
const ENotSupportedTLN: vector<u8> = b"Tried to register a name with an unsupported TLN.";

/// A Subname configuration object.
/// 
/// Holds the allow-listed TLNs, the max depth and the minimum label size.
public struct SubnameConfig has copy, drop, store {
    allowed_tlns: vector<String>,
    max_depth: u8,
    min_label_size: u8,
    minimum_duration: u64,
}

/// Returns the default config for Subnames.
public fun default(): SubnameConfig {
    SubnameConfig {
        allowed_tlns: vector[iota_tln()],
        max_depth: MAX_SUBNAME_DEPTH,
        min_label_size: MIN_LABEL_SIZE,
        minimum_duration: MINIMUM_SUBNAME_DURATION,
    }
}

/// Generates a custom config for Subnames.
public fun new(
    allowed_tlns: vector<String>,
    max_depth: u8,
    min_label_size: u8,
    minimum_duration: u64,
): SubnameConfig {
    SubnameConfig {
        allowed_tlns,
        max_depth,
        min_label_size,
        minimum_duration,
    }
}

/// Validates that the child name is a valid child for parent.
public fun assert_is_valid_subname(parent: &Name, child: &Name, config: &SubnameConfig) {
    assert!(is_parent_of(parent, child), EInvalidParent);
    assert!(is_valid_tln(child, config), ENotSupportedTLN);
    assert!(is_valid_label(child, config), EInvalidLabelSize);
    assert!(has_valid_depth(child, config), EDepthExceedsLimit);
}

/// Returns the configured minimum duration for a subname in milliseconds.
public fun minimum_duration(config: &SubnameConfig): u64 {
    config.minimum_duration
}

/// Validates that the depth of the subname is with the allowed range.
public fun has_valid_depth(name: &Name, config: &SubnameConfig): bool {
    name.number_of_levels() <= (config.max_depth as u64)
}

/// Validates that the TLN of the name is supported for subnames.
/// 
/// In the beginning, only .iota names will be supported but we might
/// want to add support for others (or not allow).
/// (E.g., with `.move` service, we might want to restrict how subnames are created)
public fun is_valid_tln(name: &Name, config: &SubnameConfig): bool {
    let mut i = 0;
    while (i < config.allowed_tlns.length()) {
        if (name.tln() == &config.allowed_tlns[i]) { return true };
        i = i + 1;
    };
    false
}

/// Validates that the subname label (e.g. `sub` in `sub.example.iota`) is valid.
/// 
/// We do not need to check for max length (64), as this is already checked
/// in the `Name` construction.
public fun is_valid_label(name: &Name, config: &SubnameConfig): bool {
    // our label is the last vector element, as labels are stored in reverse order.
    let label = name.label(name.number_of_levels() - 1);
    label.length() >= (config.min_label_size as u64)
}
