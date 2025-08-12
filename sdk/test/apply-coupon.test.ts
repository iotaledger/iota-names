// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from 'vitest';

import { applyCouponsToPrice, applyCouponToPrice } from '../src/coupons';
import { Coupon } from '../src/types';

function mockCoupon(config: { kind: 1 | 0; amount: string; can_stack?: boolean }): Coupon {
    return {
        couponCode: 'dummy-coupon',
        kind: config.kind,
        amount: config.amount,
        rules: {
            available_claims: null,
            user: null,
            expiration: null,
            length: null,
            years: null,
            can_stack: config.can_stack ?? false,
        },
    };
}

describe('Single', () => {
    describe('fixed coupon applied to price', () => {
        test('should modify the price correctly', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '1000',
            });
            const discountedPrice = applyCouponToPrice(coupon, 1_000_000n);
            expect(discountedPrice).toBe(999000n);
        });

        test('should cap at 0, if discounted price is negative', () => {
            const coupon = mockCoupon({
                kind: 1,
                amount: '10000',
            });
            const discountedPrice = applyCouponToPrice(coupon, 10n);
            expect(discountedPrice).toBe(0n);
        });
    });

    describe('percentage coupon applied to price', () => {
        test('should modify the price correctly', () => {
            const coupon = mockCoupon({
                kind: 0,
                amount: '85',
            });
            const discountedPrice = applyCouponToPrice(coupon, 10_000n);
            expect(discountedPrice).toBe(1_500n);
        });
    });
});

describe('Multiple', () => {
    describe('fixed coupons applied to price', () => {
        test('should modify the price correctly', () => {
            const coupons = [
                mockCoupon({
                    kind: 1,
                    amount: '1000',
                    can_stack: true,
                }),
                mockCoupon({
                    kind: 1,
                    amount: '2000',
                    can_stack: true,
                }),
            ];
            const discountedPrice = applyCouponsToPrice(coupons, 10_000n);
            expect(discountedPrice).toBe(7000n);
        });

        test('should cap at 0, if discounted price is negative', () => {
            const coupons = [
                mockCoupon({
                    kind: 1,
                    amount: '1000',
                    can_stack: true,
                }),
                mockCoupon({
                    kind: 1,
                    amount: '2000',
                    can_stack: true,
                }),
            ];
            const discountedPrice = applyCouponsToPrice(coupons, 10n);
            expect(discountedPrice).toBe(0n);
        });
    });

    describe('percentage coupons applied to price', () => {
        test('should modify the price correctly', () => {
            const coupons = [
                mockCoupon({
                    kind: 0,
                    amount: '20',
                    can_stack: true,
                }),
                mockCoupon({
                    kind: 0,
                    amount: '10',
                    can_stack: true,
                }),
            ];
            const discountedPrice = applyCouponsToPrice(coupons, 10_000n);
            expect(discountedPrice).toBe(7_200n);
        });
    });

    describe('mixed coupons applied to price', () => {
        test('should modify the price correctly', () => {
            const coupons = [
                mockCoupon({
                    kind: 0,
                    amount: '20',
                    can_stack: true,
                }),
                mockCoupon({
                    kind: 1,
                    amount: '1000',
                    can_stack: true,
                }),
            ];
            const discountedPrice = applyCouponsToPrice(coupons, 10_000n);
            expect(discountedPrice).toBe(7_000n);
        });
    });
});
