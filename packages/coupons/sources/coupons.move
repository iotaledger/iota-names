// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names_coupons::coupons;

use iota::hex;
use iota::table::{Self, Table};
use iota_names_coupons::coupon::{Self, Coupon};
use iota_names_coupons::rules::CouponRules;

use std::string::String;

#[error]
const ECouponAlreadyExists: vector<u8> = b"Coupon already exists.";
#[error]
const ECouponDoesNotExist: vector<u8> = b"Coupon does not exist.";

// This is an indirection structure for holding coupons which allows access mediation
// via the authorization mechanism. Only authorized apps should have mutable 
// access to this struct, whereas anyone can access the containing shared object.
/// A list of coupons keyed by their hashed code.
public struct Coupons has store {
    // hold a list of all coupons in the system.
    coupons: Table<vector<u8>, Coupon>,
}

// === Public functions ===

/// Add percentaged based coupon.
public fun add_percentage_coupon(
    self: &mut Coupons,
    hash: String,
    percentage: u64,
    rules: CouponRules,
) {
    self.save_coupon(hash, coupon::new_percentage(percentage, rules));
}

/// Add fixed amount coupon.
public fun add_fixed_coupon(
    self: &mut Coupons,
    hash: String,
    amount: u64,
    rules: CouponRules,
) {
    self.save_coupon(hash, coupon::new_fixed(amount, rules));
}

// === Internal functions ===

/// Creates the `Coupons` struct.
public(package) fun new(ctx: &mut TxContext): Coupons {
    Coupons {
        coupons: table::new(ctx),
    }
}

/// Removes a coupon from the system.
public(package) fun remove_coupon(self: &mut Coupons, hash: String) {
    let hash = hex::decode(hash.into_bytes());
    assert!(self.coupons.contains(hash), ECouponDoesNotExist);
    let _: Coupon = self.coupons.remove(hash);
}

/// Save the coupon in the shared object's config.
public(package) fun save_coupon(self: &mut Coupons, hash: String, coupon: Coupon) {
    let hash = hex::decode(hash.into_bytes());
    assert!(!self.coupons.contains(hash), ECouponAlreadyExists);
    self.coupons.add(hash, coupon);
}

/// Returns a reference to the coupon table.
public(package) fun coupons(self: &Coupons): &Table<vector<u8>, Coupon> {
    &self.coupons
}

/// Returns a mutable reference to the coupon table.
public(package) fun coupons_mut(self: &mut Coupons): &mut Table<vector<u8>, Coupon> {
    &mut self.coupons
}
