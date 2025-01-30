// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Some constants used in coupons.
module coupons::constants;

/// discount types
/// Percentage discount (0,100]
const PERCENTAGE_DISCOUNT: u8 = 0;
/// Fixed NANOS discount (e.g. -5 IOTA)
const FIXED_PRICE_DISCOUNT: u8 = 1;

/// A getter for the percentage discount type.
public fun percentage_discount_type(): u8 { PERCENTAGE_DISCOUNT }

/// A getter for the fixed price discount type.
public fun fixed_price_discount_type(): u8 { FIXED_PRICE_DISCOUNT }

/// A vector with all the discount rule types.
public fun discount_rule_types(): vector<u8> {
    vector[PERCENTAGE_DISCOUNT, FIXED_PRICE_DISCOUNT]
}
