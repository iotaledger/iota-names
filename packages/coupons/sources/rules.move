// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// A module with a couple of helpers for validation of coupons, names etc.
module iota_names_coupons::rules;

use iota::clock::Clock;
use iota_names_coupons::range::Range;

// Errors
/// Error when you try to use a coupon that isn't valid for these years.
#[error]
const EInvalidYears: vector<u8> = b"Coupon is not valid for the given number of years.";
/// Error when you try to use a coupon which doesn't match the domain's length.
#[error]
const EInvalidForDomainLength: vector<u8> = b"Coupon is not valid for the given domain length.";
/// Error when you try to use a domain that has used all its available claims.
#[error]
const ENoMoreAvailableClaims: vector<u8> = b"Coupon has been claimed the maximum number of times.";
/// Error when you try to create a percentage discount coupon with invalid
/// percentage amount.
#[error]
const EInvalidPercentage: vector<u8> = b"Invalid percentage amount for coupon.";
/// Error when you try to use a coupon without the matching address
#[error]
const EInvalidUser: vector<u8> = b"Coupon address does not match.";
/// Error when coupon has expired
#[error]
const ECouponExpired: vector<u8> = b"Coupon has expired.";
/// Available claims can't be 0.
#[error]
const EInvalidAvailableClaims: vector<u8> = b"Number of claims cannot be zero.";
#[error]
const ENonStackingCoupon: vector<u8> = b"Coupon cannot be used with other coupons.";

/// The Struct that holds the coupon's rules.
/// All rules are combined in `AND` fashion.
/// All of the checks have to pass for a coupon to be used.
public struct CouponRules has copy, drop, store {
    length: Option<Range>,
    available_claims: Option<u64>,
    user: Option<address>,
    expiration: Option<u64>,
    years: Option<Range>,
    can_stack: bool,
}

/// This is used in a PTB when creating a coupon.
/// Creates a CouponRules object to be used to create a coupon.
/// All rules are optional, and can be used together where each
/// constrains the coupon further.
/// 1. Length: The name has to be in range [from, to]
/// 2. Max available claims
/// 3. Only for a specific address
/// 4. Only for a specific expiration date
/// 5. Only for registrations or renewals for years in the range [from, to]
public fun new_coupon_rules(
    length: Option<Range>,
    available_claims: Option<u64>,
    user: Option<address>,
    expiration: Option<u64>,
    years: Option<Range>,
    can_stack: bool,
): CouponRules {
    assert!(
        available_claims.is_none() || (*available_claims.borrow() > 0),
        EInvalidAvailableClaims,
    );
    CouponRules {
        length,
        available_claims,
        user,
        expiration,
        years,
        can_stack,
    }
}

// A convenient helper to create a zero rule `CouponRules` object.
// This helps generate a coupon that can be used without any of the
// restrictions.
public fun new_empty_rules(): CouponRules {
    CouponRules {
        length: option::none(),
        available_claims: option::none(),
        user: option::none(),
        expiration: option::none(),
        years: option::none(),
        can_stack: true,
    }
}

/// If the rules track available claims, we decrease it.
/// Aborts if there are no more available claims on that coupon.
public fun decrease_available_claims(rules: &mut CouponRules) {
    if (rules.available_claims.is_some()) {
        assert!(has_available_claims(rules), ENoMoreAvailableClaims);
        // Decrease available claims by 1.
        let available_claims = *rules.available_claims.borrow();
        rules.available_claims.swap(available_claims - 1);
    }
}

// Checks whether a coupon has available claims.
// Returns true if the rule is not set OR it has not used all the available claims.
public fun has_available_claims(rules: &CouponRules): bool {
    if (rules.available_claims.is_none()) return true;
    *rules.available_claims.borrow() > 0
}

/// Ensure that the coupon is valid for the given number of years.
public fun assert_coupon_valid_for_domain_years(rules: &CouponRules, years: u8) {
    assert!(is_coupon_valid_for_domain_years(rules, years), EInvalidYears);
}

// Checks if a target amount of years is valid for claim.
// Our years is either empty, or a vector [from, to] (e.g. [1,2])
// That means we can create a combination of:
// 1. Exact years (e.g. 2 years, by passing [2,2])
// 2. Range of years (e.g. [1,3])
public fun is_coupon_valid_for_domain_years(rules: &CouponRules, years: u8): bool {
    if (rules.years.is_none()) return true;

    rules.years.borrow().is_in_range(years)
}

// Ensure that the provided amount is a valid percentage, i.e. between 0 (exclusive) and 100
public fun assert_is_valid_percentage(amount: u64) {
    assert!(amount > 0, EInvalidPercentage); // protect from division by 0. 0 doesn't make sense in any scenario.
    assert!(amount <= 100, EInvalidPercentage);
}

/// Ensure that the coupons is valid for the given domain length.
/// Throws `EInvalidForDomainLength` error if it has expired.
public fun assert_coupon_valid_for_domain_size(rules: &CouponRules, length: u8) {
    assert!(is_coupon_valid_for_domain_size(rules, length), EInvalidForDomainLength)
}

/// Returns whether the coupons is valid for the given domain length
public fun is_coupon_valid_for_domain_size(rules: &CouponRules, length: u8): bool {
    // If the vec is not set, we pass this rule test.
    if (rules.length.is_none()) return true;

    rules.length.borrow().is_in_range(length)
}

/// Ensure that the coupon is valid for the specified address.
/// Throws `EInvalidUser` error if it has expired.
public fun assert_coupon_valid_for_address(rules: &CouponRules, user: address) {
    assert!(is_coupon_valid_for_address(rules, user), EInvalidUser);
}

/// Check that the domain is valid for the specified address
public fun is_coupon_valid_for_address(rules: &CouponRules, user: address): bool {
    if (rules.user.is_none()) return true;
    rules.user.borrow() == user
}

/// Ensure that the coupon is not expired
/// Throws `ECouponExpired` error if it has expired.
public fun assert_coupon_is_not_expired(rules: &CouponRules, clock: &Clock) {
    assert!(!is_coupon_expired(rules, clock), ECouponExpired);
}

/// Check whether a coupon has expired
public fun is_coupon_expired(rules: &CouponRules, clock: &Clock): bool {
    if (rules.expiration.is_none()) {
        return false
    };

    clock.timestamp_ms() > *rules.expiration.borrow()
}

/// Ensure that the coupon can be stacked. Stacking coupons can be added to a purchase if
/// there have only been other stacking coupons used. Non stacking coupons cannot be added
/// with other coupons.
/// Throws `ENonStackingCoupon` error if it cannot stack.
public fun assert_coupon_can_stack(rules: &CouponRules, used_non_stacking: bool) {
    assert!(!used_non_stacking && rules.can_coupon_stack(), ENonStackingCoupon);
}

/// Check whether a coupon can stack with other coupons
public fun can_coupon_stack(rules: &CouponRules): bool {
    rules.can_stack
}
