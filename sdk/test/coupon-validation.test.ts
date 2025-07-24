// Copyright (c) 2025 IOTA Stiftung

// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from 'vitest';

import { validateCoupon } from '../src/coupons';
import { Coupon } from '../src/types';

const INVALID_YEARS = 'Coupon is not valid for the given number of years.';
const INVALID_FOR_NAME_LENGTH = 'Coupon is not valid for the given name length.';
const INVALID_PERCENTAGE = 'Invalid percentage amount for coupon.';
const INVALID_USER = 'Coupon address does not match.';
const COUPON_EXPIRED = 'Coupon has expired.';
const INVALID_AVAILABLE_CLAIMS = 'Number of claims cannot be zero.';

const DEFAULT_YEARS_RENEWAL = 1;
const DEFAULT_NAME_LEN = 5;

function mockCoupon(config: {
    kind: 1 | 0;
    amount: string;
    available_claims?: string | null;
    user?: string | null;
    expiration?: string | null;
    length?: { from: number; to: number } | null;
    years?: { from: number; to: number } | null;
    can_stack?: boolean;
}): Coupon {
    return {
        couponCode: 'coup',
        kind: config.kind,
        amount: config.amount,
        rules: {
            available_claims: config.available_claims ?? '1',
            user: config.user ?? null,
            expiration: config.expiration ?? null,
            length: config.length ?? null,
            years: config.years ?? null,
            can_stack: config.can_stack ?? false,
        },
    };
}

describe('Single', () => {
    describe('validate available claims', () => {
        test('check if it has available claims', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });
        test('check if it has available claims when null', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: null,
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });
        test('throw error if no available claims', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '10000',
                available_claims: '0',
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_AVAILABLE_CLAIMS,
            );
        });
    });
});

describe('Single', () => {
    describe('validate coupon for name years', () => {
        test('check range of years', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                years: { from: 1, to: 3 },
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });

        test('check range of null years', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                years: null,
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });

        test('check invalid upper range of years', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                years: { from: 1, to: 3 },
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_YEARS,
            );
        });
        test('check invalid lower range of years', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                years: { from: 1, to: 3 },
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_YEARS,
            );
        });
        test('check fixed number of years', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                years: { from: 2, to: 2 },
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });
        test('check invalid upper fixed years', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                years: { from: 2, to: 2 },
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_YEARS,
            );
        });
        test('check invalid lower fixed years', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                years: { from: 2, to: 2 },
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_YEARS,
            );
        });
    });
});

describe('Single', () => {
    describe('validate coupon percentage', () => {
        test('valid percentage', () => {
            const coupon = mockCoupon({
                kind: 0,
                amount: '50',
                available_claims: '1',
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });

        test('invalid over than 100 percentage', () => {
            const coupon = mockCoupon({
                kind: 0,
                amount: '500',
                available_claims: '1',
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_PERCENTAGE,
            );
        });
        test('invalid 0 percentage', () => {
            const coupon = mockCoupon({
                kind: 0,
                amount: '0',
                available_claims: '1',
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_PERCENTAGE,
            );
        });
        test('invalid negative percentage', () => {
            const coupon = mockCoupon({
                kind: 0,
                amount: '-50',
                available_claims: '1',
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_PERCENTAGE,
            );
        });
    });
});

describe('Single', () => {
    describe('validate coupon length', () => {
        test('check valid length', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                length: { from: 3, to: 5 },
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });
        test('check null length', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                length: null,
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });
        test('check invalid upper range of length', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                length: { from: 3, to: 5 },
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_FOR_NAME_LENGTH,
            );
        });
        test('check invalid lower range of length', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                length: { from: 3, to: 5 },
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_FOR_NAME_LENGTH,
            );
        });
        test('check valid fixed length', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                length: { from: 2, to: 2 },
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });

        test('check invalid upper fixed length', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                length: { from: 2, to: 2 },
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_FOR_NAME_LENGTH,
            );
        });
        test('check invalid lower range of length', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                length: { from: 2, to: 2 },
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                INVALID_FOR_NAME_LENGTH,
            );
        });
    });
});

describe('Single', () => {
    describe('validate coupon user address', () => {
        test('check a valid user', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                user: '0xd17a0271bb4ae0a12af1a6d458805b6220603bb73a025d8da6d5c4cc848395e1',
            });
            const result = validateCoupon(
                coupon,
                DEFAULT_YEARS_RENEWAL,
                DEFAULT_NAME_LEN,
                '0xd17a0271bb4ae0a12af1a6d458805b6220603bb73a025d8da6d5c4cc848395e1',
            );
            expect(result).toBe(undefined);
        });
        test('check a null user', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                user: null,
            });
            const result = validateCoupon(
                coupon,
                DEFAULT_YEARS_RENEWAL,
                DEFAULT_NAME_LEN,
                '0xd17a0271bb4ae0a12af1a6d458805b6220603bb73a025d8da6d5c4cc848395e1',
            );
            expect(result).toBe(undefined);
        });
        test('check a invalid user', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '10000',
                available_claims: '0',
                user: '0xd17a0271bb4ae0a12af1a6d458805b6220603bb73a025d8da6d5c4cc848395e1',
            });
            expect(() =>
                validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN, '0x123abc'),
            ).toThrow(INVALID_USER);
        });
    });
});

describe('Single', () => {
    describe('validate expired coupons', () => {
        test('check a non expired coupon', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                expiration: (Date.now() + 100000).toString(),
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });
        test('check a null expired coupon', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
                available_claims: '1',
                expiration: null,
            });
            const result = validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN);
            expect(result).toBe(undefined);
        });
        test('check an expired coupon', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '10000',
                available_claims: '0',
                expiration: (Date.now() - 100000).toString(),
            });
            expect(() => validateCoupon(coupon, DEFAULT_YEARS_RENEWAL, DEFAULT_NAME_LEN)).toThrow(
                COUPON_EXPIRED,
            );
        });
    });
});
