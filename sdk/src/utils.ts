// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Coupon } from './types';

const LABEL_REGEX = /(?!-)[a-z0-9-]{0,62}[a-z0-9]/;
const PATH_REGEX = new RegExp(`(?:${LABEL_REGEX.source}(?:\\.${LABEL_REGEX.source})*)`);
const NAME_AT_REGEX = new RegExp(`^(${PATH_REGEX.source})?@${LABEL_REGEX.source}$`);
const NAME_DOT_REGEX = new RegExp(`^(?:${LABEL_REGEX.source}\\.)+(iota)$`);
const MAX_LENGTH = 235;

export function isValidIotaName(name: string): boolean {
    if (name.length > MAX_LENGTH) {
        return false;
    }

    return NAME_AT_REGEX.test(name) || NAME_DOT_REGEX.test(name);
}

export function normalizeIotaName(name: string, format: 'at' | 'dot' = 'at'): string {
    const lowerCase = name.toLowerCase();
    let parts;

    if (NAME_AT_REGEX.test(lowerCase)) {
        let [path, name] = lowerCase.split('@');
        parts = [...(path ? path.split('.') : []), name];
    } else if (NAME_DOT_REGEX.test(lowerCase)) {
        parts = lowerCase.split('.').slice(0, -1);
    } else {
        throw new Error(`Invalid IOTA name "${name}"`);
    }

    if (format === 'dot') {
        return `${parts.join('.')}.iota`;
    } else {
        return `${parts.slice(0, -1).join('.')}@${parts[parts.length - 1]}`;
    }
}

export function validateIotaName(
    name: string,
    minLength: number = 3,
    maxLength: number = 64,
    allowSubnames: boolean = true,
): string | null {
    if (!name) return null;
    const lowerCase = name.toLowerCase();

    const parts = lowerCase.split('.');

    if (!allowSubnames && parts.length > 2) {
        return 'No subnames allowed';
    }
    if (!NAME_DOT_REGEX.test(name)) {
        return 'Invalid characters. Only a-z, 0-9, and hyphens (not at the beginning or end) are allowed';
    }
    for (const part of parts.slice(0, -1)) {
        if (part.length < minLength || part.length > maxLength) {
            return `Name must be ${minLength}-${maxLength} characters long`;
        }
    }
    return null;
}

export function hasAvailableClaims(rules: { available_claims?: string | null }): boolean {
    if (rules.available_claims === null || rules.available_claims === undefined) {
        return true;
    }
    return parseInt(rules.available_claims) > 0;
}

export function isCouponValidForNameYears(
    rules: { years?: { from: number; to: number } | null },
    years: number,
): boolean {
    if (!rules.years || rules.years === null) {
        return true;
    }
    const { from: minYears, to: maxYears } = rules.years;
    return years >= minYears && years <= maxYears;
}

export function isValidCouponPercentage(amount: string): boolean {
    return parseFloat(amount) > 0 && parseFloat(amount) <= 100;
}

export function isCouponValidForNameLength(
    rules: { length?: { from: number; to: number } | null },
    length: number,
): boolean {
    if (!rules.length || rules.length === null) {
        return true;
    }
    const { from: minLength, to: maxLength } = rules.length;
    return length >= minLength && length <= maxLength;
}

export function isCouponValidForAddress(
    rules: { user?: string | null },
    userAddress: string,
): boolean {
    if (!rules.user || rules.user === null) {
        return true;
    }
    return rules.user === userAddress;
}

export function isCouponExpired(
    rules: { expiration?: string | null },
    currentTimestamp: number = Date.now(),
): boolean {
    if (!rules.expiration || rules.expiration === null) {
        return false;
    }
    return currentTimestamp > Number(rules.expiration);
}

export function validateCoupon(
    _coupon: Coupon,
    years: number,
    length: number,
    userAddress: string,
): boolean {
    const availableClaims = hasAvailableClaims(_coupon.rules);
    const isValidForNameYears = isCouponValidForNameYears(_coupon.rules, years);
    const isValidPercentage = isValidCouponPercentage(_coupon.amount);
    const isValidForNameLength = isCouponValidForNameLength(_coupon.rules, length);
    const isValidForAddress = isCouponValidForAddress(_coupon.rules, userAddress);
    const isExpired = isCouponExpired(_coupon.rules);
    return (
        availableClaims &&
        isValidForNameYears &&
        isValidPercentage &&
        isValidForNameLength &&
        isValidForAddress &&
        !isExpired
    );
}

export function applyCouponsToPrice(coupons: Coupon[], initialPrice: number): number {
    if (!coupons || coupons.length === 0) {
        return initialPrice;
    }

    let price = initialPrice;

    for (const coupon of coupons) {
        if (!coupon.rules.can_stack && coupons.length > 1) {
            throw new Error('Coupons provided cannot be stacked');
        }

        price = applyCouponToPrice(price, coupon);
    }

    return price;
}

export function applyCouponToPrice(price: number, coupon?: Coupon): number {
    if (!coupon) {
        return price;
    }

    const couponAmount = Number(coupon.amount);

    // 0 => percentage off
    // 1 => fixed amount off,
    if (coupon.kind === 0) {
        let discountAmount = (price * couponAmount) / 100;
        return price - discountAmount;
    } else if (coupon.kind === 1) {
        const discountedAmount = price - couponAmount;

        return discountedAmount < 0 ? 0 : discountedAmount;
    } else {
        throw new Error(`Unknown coupon kind: ${coupon.kind}`);
    }
}
