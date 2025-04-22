// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// A module with a couple of helpers for validation of coupons
// validation of names etc.
module iota_names_coupons::rules;

use iota::clock::Clock;
use iota_names_coupons::{coupon_constants, range::Range};

// Errors
/// Error when you try to use a coupon that isn't valid for these years.
#[error]
const EInvalidYears: vector<u8> = b"Coupon is not valid for the given number of years.";
/// Error when you try to use a coupon which doesn't match to the domain's size.
#[error]
const EInvalidForDomainLength: vector<u8> = b"Coupon is not valid for the given domain length.";
/// Error when you try to use a domain that has used all it's available claims.
#[error]
const ENoMoreAvailableClaims: vector<u8> = b"Domain has been claimed the maximum number of times.";
/// Error when you try to create a percentage discount coupon with invalid
/// percentage amount.
#[error]
const EInvalidAmount: vector<u8> = b"Invalid percentage amount for coupon.";
/// Error when you try to create a coupon with invalid type.
#[error]
const EInvalidType: vector<u8> = b"Invalid type for coupon.";
/// Error when you try to use a coupon without the matching address
#[error]
const EInvalidUser: vector<u8> = b"Coupon address does not match.";
/// Error when coupon has expired
#[error]
const ECouponExpired: vector<u8> = b"Coupon has expired.";
/// Available claims can't be 0.
#[error]
const EInvalidAvailableClaims: vector<u8> = b"Number of claims cannot be zero.";

/// The Struct that holds the coupon's rules.
/// All rules are combined in `AND` fashion.
/// All of the checks have to pass for a coupon to be used.
public struct CouponRules has copy, drop, store {
    length: Option<Range>,
    available_claims: Option<u64>,
    user: Option<address>,
    expiration: Option<u64>,
    years: Option<Range>,
}

/// This is used in a PTB when creating a coupon.
/// Creates a CouponRules object to be used to create a coupon.
/// All rules are optional, and can be chained (`AND`) format.
/// 1. Length: The name has to be in range [from, to]
/// 2. Max available claims
/// 3. Only for a specific address
/// 4. Might have an expiration date.
/// 5. Might be valid only for registrations in a range [from, to]
public fun new_coupon_rules(
    length: Option<Range>,
    available_claims: Option<u64>,
    user: Option<address>,
    expiration: Option<u64>,
    years: Option<Range>,
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
    }
}

/// If the rules count `available_claims`, we decrease it.
/// Aborts if there are no more available claims on that coupon.
/// We shouldn't get here ever, as we're checking this on the coupon creation,
/// but
/// keeping it as a sanity check (e.g. created a coupon with 0 available
/// claims).
public fun decrease_available_claims(rules: &mut CouponRules) {
    if (rules.available_claims.is_some()) {
        assert!(has_available_claims(rules), ENoMoreAvailableClaims);
        // Decrease available claims by 1.
        let available_claims = *rules.available_claims.borrow();
        rules.available_claims.swap(available_claims - 1);
    }
}

// Checks whether a coupon has available claims.
// Returns true if the rule is not set OR it has used all the available claims.
public fun has_available_claims(rules: &CouponRules): bool {
    if (rules.available_claims.is_none()) return true;
    *rules.available_claims.borrow() > 0
}

// Assertion helper for the validity of years.
public fun assert_coupon_valid_for_domain_years(rules: &CouponRules, target: u8) {
    assert!(is_coupon_valid_for_domain_years(rules, target), EInvalidYears);
}

// Checks if a target amount of years is valid for claim.
// Our years is either empty, or a vector [from, to] (e.g. [1,2])
// That means we can create a combination of:
// 1. Exact years (e.g. 2 years, by passing [2,2])
// 2. Range of years (e.g. [1,3])
public fun is_coupon_valid_for_domain_years(rules: &CouponRules, target: u8): bool {
    if (rules.years.is_none()) return true;

    rules.years.borrow().is_in_range(target)
}

public fun assert_is_valid_discount_type(`type`: u8) {
    assert!(coupon_constants::discount_rule_types().contains(&`type`), EInvalidType);
}

// verify that we are creating the coupons correctly (based on amount & type).
// for amounts, if we have a percentage discount, our max num is 100.
public fun assert_is_valid_amount(_: u8, amount: u64) {
    assert!(amount > 0, EInvalidAmount); // protect from division by 0. 0 doesn't make sense in any scenario.
    assert!(amount <= 100, EInvalidAmount);
}

// We check a DomainSize Rule against the length of a domain.
// We return if the length is valid based on that.
public fun assert_coupon_valid_for_domain_size(rules: &CouponRules, length: u8) {
    assert!(is_coupon_valid_for_domain_size(rules, length), EInvalidForDomainLength)
}

/// We check the length of the name based on the domain length rule
public fun is_coupon_valid_for_domain_size(rules: &CouponRules, length: u8): bool {
    // If the vec is not set, we pass this rule test.
    if (rules.length.is_none()) return true;

    rules.length.borrow().is_in_range(length)
}

// We check that the coupon is valid for the specified address.
/// Throws `EInvalidUser` error if it has expired.
public fun assert_coupon_valid_for_address(rules: &CouponRules, user: address) {
    assert!(is_coupon_valid_for_address(rules, user), EInvalidUser);
}

/// Check that the domain is valid for the specified address
public fun is_coupon_valid_for_address(rules: &CouponRules, user: address): bool {
    if (rules.user.is_none()) return true;
    rules.user.borrow() == user
}

/// Simple assertion for the coupon expiration.
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
