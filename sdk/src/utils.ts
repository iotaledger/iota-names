// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    hasAvailableClaims,
    isCouponExpired,
    isCouponValidForAddress,
    isCouponValidForNameLength,
    isCouponValidForNameYears,
    isValidCouponPercentage,
} from './coupons';
import { Coupon } from './types';

const LABEL_REGEX = /(?!-)[a-z0-9-]{0,62}[a-z0-9]/;
const SUBNAME_REGEX = /^(?!-)[a-z0-9-]{1,62}[a-z0-9]$/;
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

const LONG_NAMES_TRUNCATE_LENGTH = 11;
const CHARACTERS_TO_SHOW = 6;

interface NormalizeOptions {
    onlyFirstSubname?: boolean;
    truncateLongParts?: boolean;
}

export function normalizeIotaName(
    name: string,
    format: 'at' | 'dot' = 'at',
    { onlyFirstSubname, truncateLongParts }: NormalizeOptions = {},
): string {
    const lowerCase = name.toLowerCase();
    let parts;

    // Split in parts
    if (NAME_AT_REGEX.test(lowerCase)) {
        let [path, name] = lowerCase.split('@');
        parts = [...(path ? path.split('.') : []), name];
    } else if (NAME_DOT_REGEX.test(lowerCase)) {
        parts = lowerCase.split('.').slice(0, -1);
    } else {
        throw new Error(`Invalid IOTA name "${name}"`);
    }

    // Only select the first subname if desired
    let subnames = onlyFirstSubname
        ? [
              // First name from the left (e.g yes.no.no.no.iota)
              parts[0],
              parts.length > 2 ? (format === 'dot' ? '.' : '..') : '',
          ].filter(Boolean)
        : parts.slice(0, -1);
    let parentName = parts[parts.length - 1];

    if (truncateLongParts) {
        subnames = subnames.map((s) => {
            return s.length > LONG_NAMES_TRUNCATE_LENGTH
                ? `${s.slice(0, CHARACTERS_TO_SHOW)}...${s.slice(-CHARACTERS_TO_SHOW)}`
                : s;
        });

        parentName =
            parentName.length > LONG_NAMES_TRUNCATE_LENGTH
                ? `${parentName.slice(0, CHARACTERS_TO_SHOW)}...${parentName.slice(-CHARACTERS_TO_SHOW)}`
                : parentName;
    }

    // Construct name
    if (format === 'dot') {
        return `${[...subnames, parentName].join('.')}.iota`;
    } else {
        return `${subnames.join('.')}@${parentName}`;
    }
}

export function validateIotaSubname(
    name: string,
    minLength: number = 3,
    maxLength: number = 64,
): string | null {
    if (!name) return null;
    const lowerCase = name.toLowerCase();

    if (!SUBNAME_REGEX.test(lowerCase)) {
        return 'Invalid characters. Only a-z, 0-9, and hyphens (not at the beginning or end) are allowed';
    }
    if (name.length < minLength || name.length > maxLength) {
        return `Name must be ${minLength}-${maxLength} characters long`;
    }
    return null;
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

export function validateCoupon(coupon: Coupon, years: number, length: number, address?: string) {
    try {
        hasAvailableClaims(coupon.rules);
        isCouponValidForNameYears(coupon.rules, years);
        isValidCouponPercentage(coupon.amount);
        isCouponValidForNameLength(coupon.rules, length);
        isCouponValidForAddress(coupon.rules, address);
        isCouponExpired(coupon.rules);
    } catch (error: unknown) {
        throw new Error(
            `Coupon '${coupon.couponCode}' validation failed: ${(error as Error)?.message}`,
        );
    }
}

export function validateCoupons(
    coupons: Coupon[],
    years: number,
    length: number,
    address?: string,
) {
    for (const coupon of coupons) {
        validateCoupon(coupon, years, length, address);
    }
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
