// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names_coupons::coupons;

use iota::bag::{Self, Bag};
use iota_names_coupons::coupon::Coupon;

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
    coupons: Bag,
}

public(package) fun new(ctx: &mut TxContext): Coupons {
    Coupons {
        coupons: bag::new(ctx),
    }
}

/// Private internal functions
/// An internal function to save the coupon in the shared object's config.
public(package) fun save_coupon(self: &mut Coupons, hash: vector<u8>, coupon: Coupon) {
    assert!(!self.coupons.contains(hash), ECouponAlreadyExists);
    self.coupons.add(hash, coupon);
}

// A function to remove a coupon from the system.
public(package) fun remove_coupon(self: &mut Coupons, hash: vector<u8>) {
    assert!(self.coupons.contains(hash), ECouponDoesNotExist);
    let _: Coupon = self.coupons.remove(hash);
}

public(package) fun coupons(data: &Coupons): &Bag {
    &data.coupons
}

public(package) fun coupons_mut(data: &mut Coupons): &mut Bag {
    &mut data.coupons
}
