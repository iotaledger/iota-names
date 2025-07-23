// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const EInvalidYears = 'Coupon is not valid for the given number of years.';
const EInvalidForNameLength = 'Coupon is not valid for the given name length.';
const EInvalidPercentage = 'Invalid percentage amount for coupon.';
const EInvalidUser = 'Coupon address does not match.';
const ECouponExpired = 'Coupon has expired.';
const EInvalidAvailableClaims = 'Number of claims cannot be zero.';

export function hasAvailableClaims(rules: { available_claims?: string | null }): boolean {
    if (rules.available_claims === null || rules.available_claims === undefined) {
        return true;
    }
    if (parseInt(rules.available_claims) > 0) {
        return true;
    }
    throw new Error(EInvalidAvailableClaims);
}

export function isCouponValidForNameYears(
    rules: { years?: { from: number; to: number } | null },
    years: number,
): boolean {
    if (!rules.years || rules.years === null) {
        return true;
    }
    const { from: minYears, to: maxYears } = rules.years;
    if (years >= minYears && years <= maxYears) {
        return true;
    }
    throw new Error(EInvalidYears);
}

export function isValidCouponPercentage(amount: string): boolean {
    if (parseInt(amount) > 0 && parseInt(amount) <= 100) {
        return true;
    }
    throw new Error(EInvalidPercentage);
}

export function isCouponValidForNameLength(
    rules: { length?: { from: number; to: number } | null },
    length: number,
): boolean {
    if (!rules.length || rules.length === null) {
        return true;
    }
    const { from: minLength, to: maxLength } = rules.length;
    if (length >= minLength && length <= maxLength) {
        return true;
    }
    throw new Error(EInvalidForNameLength);
}

export function isCouponValidForAddress(
    rules: { user?: string | null },
    userAddress: string,
): boolean {
    if (!rules.user || rules.user === null) {
        return true;
    }
    if (rules.user === userAddress) {
        return true;
    }
    throw new Error(EInvalidUser);
}

// TODO: make sure both timestamps are the same units (seconds vs milliseconds)
export function isCouponExpired(
    rules: { expiration?: string | null },
    currentTimestamp: number = Date.now(),
): boolean {
    if (!rules.expiration || rules.expiration === null) {
        return false;
    }
    if (currentTimestamp > Number(rules.expiration)) {
        return true;
    }
    throw new Error(ECouponExpired);
}
