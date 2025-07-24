// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const INVALID_YEARS = 'Coupon is not valid for the given number of years.';
const INVALID_FOR_NAME_LENGTH = 'Coupon is not valid for the given name length.';
const INVALID_PERCENTAGE = 'Invalid percentage amount for coupon.';
const INVALID_USER = 'Coupon address does not match.';
const COUPON_EXPIRED = 'Coupon has expired.';
const INVALID_AVAILABLE_CLAIMS = 'Number of claims cannot be zero.';

export function hasAvailableClaims(rules: { available_claims?: string | null }) {
    if (
        rules?.available_claims !== null &&
        rules?.available_claims !== undefined &&
        parseInt(rules?.available_claims) <= 0
    ) {
        throw new Error(INVALID_AVAILABLE_CLAIMS);
    }
}

export function isCouponValidForNameYears(
    rules: { years?: { from: number; to: number } | null },
    years: number,
) {
    const { from: minYears, to: maxYears } = rules.years || {};
    if (minYears && maxYears && (years < minYears || years > maxYears)) {
        throw new Error(INVALID_YEARS);
    }
}

export function isValidCouponPercentage(amount: string) {
    if (parseInt(amount) <= 0 || parseInt(amount) > 100) {
        throw new Error(INVALID_PERCENTAGE);
    }
}

export function isCouponValidForNameLength(
    rules: { length?: { from: number; to: number } | null },
    length: number,
) {
    const { from: minLength, to: maxLength } = rules.length || {};
    if (minLength && maxLength && (length < minLength || length > maxLength)) {
        throw new Error(INVALID_FOR_NAME_LENGTH);
    }
}

export function isCouponValidForAddress(rules: { user?: string | null }, userAddress: string) {
    if (rules.user && rules.user !== userAddress) {
        throw new Error(INVALID_USER);
    }
}

// TODO: make sure both timestamps are the same units (seconds vs milliseconds)
export function isCouponExpired(
    rules: { expiration?: string | null },
    currentTimestamp: string = Date.now().toString(),
) {
    if (rules.expiration && Number(currentTimestamp) > Number(rules.expiration)) {
        throw new Error(COUPON_EXPIRED);
    }
}
