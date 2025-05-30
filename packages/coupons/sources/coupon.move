// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names_coupons::coupon;

use iota_names_coupons::rules::{Self, CouponRules};

/// A Coupon has a type, a value and a ruleset.
/// - `kind` is a u8 constant which makes a coupon fixed price or discount percentage.
/// 0 -> Percentage Discount | 1 -> Fixed Discount
/// - `amount` is a u64 constant, which can be in the range of (0,100] for
/// discount percentage, or any value > 0 for fixed price.
/// - `rules` are defined per coupon and determine which actions can be taken with them.
public struct Coupon has copy, drop, store {
    kind: u8,
    amount: u64,
    rules: CouponRules,
}

/// Create a coupon object with a percentage discount.
public(package) fun new_percentage(percentage: u64, rules: CouponRules): Coupon {
    rules::assert_is_valid_percentage(percentage);
    Coupon {
        kind: 0,
        amount: percentage,
        rules,
    }
}

/// Create a coupon object with a fixed discount.
public(package) fun new_fixed(amount: u64, rules: CouponRules): Coupon {
    Coupon {
        kind: 1,
        amount,
        rules,
    }
}

public(package) fun rules(coupon: &Coupon): &CouponRules {
    &coupon.rules
}

public(package) fun rules_mut(coupon: &mut Coupon): &mut CouponRules {
    &mut coupon.rules
}

public(package) fun is_percentage(coupon: &Coupon): bool {
    coupon.kind == 0
}

public(package) fun is_fixed(coupon: &Coupon): bool {
    coupon.kind == 1
}

public(package) fun discount(coupon: &Coupon): u64 {
    coupon.amount
}
