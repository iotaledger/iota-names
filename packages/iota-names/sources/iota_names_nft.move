// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Handles creation of the `IotaNamesNft`s. Separates the logic of
/// creating
/// a `IotaNamesNft`. New `IotaNamesNft`s can be created only by the
/// `registry` and this module is tightly coupled with it.
///
/// When reviewing the module, make sure that:
///
/// - mutable functions can't be called directly by the owner
/// - all getters are public and take an immutable reference
///
module iota_names::iota_names_nft;

use std::string::String;
use iota::clock::{timestamp_ms, Clock};
use iota_names::constants;
use iota_names::domain::Domain;

/* friend iota_names::registry; */
/* friend iota_names::update_image; */

/// The main access point for the user.
public struct IotaNamesNft has key, store {
    id: UID,
    /// The parsed domain.
    domain: Domain,
    /// The domain name that the NFT is for.
    domain_name: String,
    /// Timestamp in milliseconds when this NFT expires.
    expiration_timestamp_ms: u64,
    /// Short IPFS hash of the image to be displayed for the NFT.
    image_url: String,
}

// === Protected methods ===

/// Creates a new `IotaNamesNft`.
/// Can only be called by the `registry` module.
public(package) fun new(
    domain: Domain,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): IotaNamesNft {
    IotaNamesNft {
        id: object::new(ctx),
        domain_name: domain.to_string(),
        domain,
        expiration_timestamp_ms: timestamp_ms(clock) + ((no_years as u64) * constants::year_ms()),
        image_url: constants::default_image(),
    }
}

/// Sets the `expiration_timestamp_ms` for this NFT.
public(package) fun set_expiration_timestamp_ms(
    self: &mut IotaNamesNft,
    expiration_timestamp_ms: u64,
) {
    self.expiration_timestamp_ms = expiration_timestamp_ms;
}

/// Updates the `image_url` field for this NFT. Is only called in the
/// `update_image` for now.
public(package) fun update_image_url(
    self: &mut IotaNamesNft,
    image_url: String,
) {
    self.image_url = image_url;
}

/// Destroys the `IotaNamesNft` by deleting it from the store, returning
/// storage rebates to the caller.
/// Can only be called by the `registry` module.
public(package) fun burn(self: IotaNamesNft) {
    let IotaNamesNft {
        id,
        image_url: _,
        domain: _,
        domain_name: _,
        expiration_timestamp_ms: _,
    } = self;

    id.delete();
}

// === Public methods ===

/// Check whether the `IotaNamesNft` has expired by comparing the
/// expiration timeout with the current time.
public fun has_expired(self: &IotaNamesNft, clock: &Clock): bool {
    self.expiration_timestamp_ms < timestamp_ms(clock)
}

/// Check whether the `IotaNamesNft` has expired by comparing the
/// expiration timeout with the current time. This function also takes into
/// account the grace period.
public fun has_expired_past_grace_period(
    self: &IotaNamesNft,
    clock: &Clock,
): bool {
    (self.expiration_timestamp_ms + constants::grace_period_ms()) < timestamp_ms(clock)
}

// === Getters ===

/// Get the `domain` field of the `IotaNamesNft`.
public fun domain(self: &IotaNamesNft): Domain { self.domain }

/// Get the `domain_name` field of the `IotaNamesNft`.
public fun domain_name(self: &IotaNamesNft): String { self.domain_name }

/// Get the `expiration_timestamp_ms` field of the `IotaNamesNft`.
public fun expiration_timestamp_ms(self: &IotaNamesNft): u64 {
    self.expiration_timestamp_ms
}

/// Get the `image_url` field of the `IotaNamesNft`.
public fun image_url(self: &IotaNamesNft): String { self.image_url }

// get a read-only `uid` field of `IotaNamesNft`.
public fun uid(self: &IotaNamesNft): &UID { &self.id }

/// Get the mutable `id` field of the `IotaNamesNft`.
public fun uid_mut(self: &mut IotaNamesNft): &mut UID { &mut self.id }

// === Testing ===

#[test_only]
public fun new_for_testing(
    domain: Domain,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): IotaNamesNft {
    new(domain, no_years, clock, ctx)
}

#[test_only]
public fun set_expiration_timestamp_ms_for_testing(
    self: &mut IotaNamesNft,
    expiration_timestamp_ms: u64,
) {
    set_expiration_timestamp_ms(self, expiration_timestamp_ms);
}

#[test_only]
public fun update_image_url_for_testing(
    self: &mut IotaNamesNft,
    image_url: String,
) {
    update_image_url(self, image_url);
}

#[test_only]
public fun burn_for_testing(nft: IotaNamesNft) {
    let IotaNamesNft {
        id,
        image_url: _,
        domain: _,
        domain_name: _,
        expiration_timestamp_ms: _,
    } = nft;

    id.delete();
}
