// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Some constants used in coupons.
module iota_names_coupons::coupon_constants;

/// discount types
/// Percentage discount (0,100]
const PERCENTAGE_DISCOUNT: u8 = 0;

/// A getter for the percentage discount type.
public fun percentage_discount_type(): u8 { PERCENTAGE_DISCOUNT }

/// A vector with all the discount rule types.
public fun discount_rule_types(): vector<u8> { vector[PERCENTAGE_DISCOUNT] }
