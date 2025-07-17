// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Handles creation of the `NameRegistration`s. Separates the logic of
/// creating a `NameRegistration`. New `NameRegistration`s can be created 
/// only by the `registry` and this module is tightly coupled with it.
module iota_names::name_registration;

use iota::clock::{timestamp_ms, Clock};
use iota_names::constants;
use iota_names::name::Name;
use std::string::String;

/// The main access point for the user.
public struct NameRegistration has key, store {
    id: UID,
    /// The parsed name.
    name: Name,
    /// The name that the NFT is for.
    name_str: String,
    /// Timestamp in milliseconds when this NFT expires.
    expiration_timestamp_ms: u64,
}

// === Protected methods ===

/// Creates a new `NameRegistration`.
/// Can only be called by the `registry` module.
public(package) fun new(
    name: Name,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): NameRegistration {
    NameRegistration {
        id: object::new(ctx),
        name,
        name_str: name.to_string(),
        expiration_timestamp_ms: timestamp_ms(clock) + ((no_years as u64) * constants::year_ms()),
    }
}

/// Sets the `expiration_timestamp_ms` for this NFT.
public(package) fun set_expiration_timestamp_ms(
    self: &mut NameRegistration,
    expiration_timestamp_ms: u64,
) {
    self.expiration_timestamp_ms = expiration_timestamp_ms;
}

/// Destroys the `NameRegistration` by deleting it from the store, returning
/// storage rebates to the caller.
/// Can only be called by the `registry` module.
public(package) fun burn(self: NameRegistration) {
    let NameRegistration {
        id,
        name: _,
        name_str: _,
        expiration_timestamp_ms: _,
    } = self;

    id.delete();
}

// === Public methods ===

/// Check whether the `NameRegistration` has expired by comparing the
/// expiration timeout with the current time.
public fun has_expired(self: &NameRegistration, clock: &Clock): bool {
    self.expiration_timestamp_ms < timestamp_ms(clock)
}

/// Check whether the `NameRegistration` has expired by comparing the
/// expiration timeout with the current time. This function also takes into
/// account the grace period.
public fun has_expired_past_grace_period(self: &NameRegistration, clock: &Clock): bool {
    (self.expiration_timestamp_ms + constants::grace_period_ms()) < timestamp_ms(clock)
}

// === Getters ===

/// Get the `name` field of the `NameRegistration`.
public fun name(self: &NameRegistration): Name { self.name }

/// Get the `name_str` field of the `NameRegistration`.
public fun name_str(self: &NameRegistration): String { self.name_str }

/// Get the `expiration_timestamp_ms` field of the `NameRegistration`.
public fun expiration_timestamp_ms(self: &NameRegistration): u64 {
    self.expiration_timestamp_ms
}

// Returns a read-only `uid` field of `NameRegistration`.
public fun uid(self: &NameRegistration): &UID { &self.id }

/// Get the mutable `id` field of the `NameRegistration`.
public fun uid_mut(self: &mut NameRegistration): &mut UID { &mut self.id }

// === Testing ===

#[test_only]
public fun new_for_testing(
    name: Name,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): NameRegistration {
    new(name, no_years, clock, ctx)
}

#[test_only]
public fun set_expiration_timestamp_ms_for_testing(
    self: &mut NameRegistration,
    expiration_timestamp_ms: u64,
) {
    set_expiration_timestamp_ms(self, expiration_timestamp_ms);
}

#[test_only]
public fun burn_for_testing(nft: NameRegistration) {
    let NameRegistration {
        id,
        name: _,
        name_str: _,
        expiration_timestamp_ms: _,
    } = nft;

    id.delete();
}
