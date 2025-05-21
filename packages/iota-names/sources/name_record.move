// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Provides the records which are stored for each domain in the `Registry`.
module iota_names::name_record;

use iota::clock::{timestamp_ms, Clock};
use iota::vec_map::{Self, VecMap};
use iota_names::constants;
use std::string::String;

/// A single record in the registry.
public struct NameRecord has copy, drop, store {
    /// The ID of the `IotaNamesRegistration` assigned to this record.
    ///
    /// The owner of the corresponding `IotaNamesRegistration` has the rights to
    /// be able to change and adjust the `target_address` of this domain.
    ///
    /// It is possible that the ID changes if the record expires and is
    /// purchased by someone else.
    nft_id: ID,
    /// Timestamp in milliseconds when the record expires.
    expiration_timestamp_ms: u64,
    /// The target address that this domain points to
    target_address: Option<address>,
    /// Additional user data which may be stored in a record
    user_data: VecMap<String, String>,
    /// Predefined metadata for use by external services
    metadata: VecMap<String, String>,
}

/// Create a new NameRecord.
public fun new(nft_id: ID, expiration_timestamp_ms: u64): NameRecord {
    NameRecord {
        nft_id,
        expiration_timestamp_ms,
        target_address: option::none(),
        user_data: vec_map::empty(),
        metadata: vec_map::empty(),
    }
}

/// Create a `leaf` NameRecord.
public fun new_leaf(parent_id: ID, target_address: Option<address>): NameRecord {
    NameRecord {
        nft_id: parent_id,
        expiration_timestamp_ms: constants::leaf_expiration_timestamp(),
        target_address,
        user_data: vec_map::empty(),
        metadata: vec_map::empty(),
    }
}

// === Setters ===

/// Set user data as a vec_map directly overriding the data set in the
/// registration.
public fun set_user_data(self: &mut NameRecord, user_data: VecMap<String, String>) {
    self.user_data = user_data;
}

/// Set metadata as a vec_map directly overriding the data set in the
/// registration.
public fun set_metadata(self: &mut NameRecord, metadata: VecMap<String, String>) {
    self.metadata = metadata;
}

/// Set the `target_address` field of the `NameRecord`.
public fun set_target_address(self: &mut NameRecord, new_address: Option<address>) {
    self.target_address = new_address;
}

public fun set_expiration_timestamp_ms(self: &mut NameRecord, expiration_timestamp_ms: u64) {
    self.expiration_timestamp_ms = expiration_timestamp_ms;
}

// === Getters ===

/// Check if the record has expired.
public fun has_expired(self: &NameRecord, clock: &Clock): bool {
    self.expiration_timestamp_ms < timestamp_ms(clock)
}

/// Check if the record has expired, taking into account the grace period.
public fun has_expired_past_grace_period(self: &NameRecord, clock: &Clock): bool {
    (self.expiration_timestamp_ms + constants::grace_period_ms()) < timestamp_ms(clock)
}

/// Checks whether a name_record is a `leaf` record.
public fun is_leaf_record(self: &NameRecord): bool {
    self.expiration_timestamp_ms == constants::leaf_expiration_timestamp()
}

/// Read the `user_data` field from the `NameRecord`.
public fun user_data(self: &NameRecord): &VecMap<String, String> { &self.user_data }

/// Read the `metadata` field from the `NameRecord`.
public fun metadata(self: &NameRecord): &VecMap<String, String> { &self.metadata }

/// Read the `target_address` field from the `NameRecord`.
public fun target_address(self: &NameRecord): Option<address> {
    self.target_address
}

/// Read the `nft_id` field from the `NameRecord`.
public fun nft_id(self: &NameRecord): ID { self.nft_id }

/// Read the `expiration_timestamp_ms` field from the `NameRecord`.
public fun expiration_timestamp_ms(self: &NameRecord): u64 {
    self.expiration_timestamp_ms
}
