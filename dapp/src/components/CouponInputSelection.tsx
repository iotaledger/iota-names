// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Close } from '@iota/apps-ui-icons';
import { ButtonUnstyled, Chip, ChipSize, ChipType, Input, InputType } from '@iota/apps-ui-kit';
import clsx from 'clsx';
import { useState } from 'react';

import type { UserSetCoupon } from './dialogs';

interface CouponInputSelectionProps {
    coupons: UserSetCoupon[];
    onAddCoupon: (code: string) => Promise<void>;
}

export function CouponInputSelection({ coupons, onAddCoupon }: CouponInputSelectionProps) {
    const [coupon, setCoupon] = useState<string>('');

    async function addCoupon() {
        const trimmedCoupon = coupon.trim();
        if (!trimmedCoupon || coupons.some((c) => c.code === trimmedCoupon)) return;
        await onAddCoupon(trimmedCoupon);
        setCoupon('');
    }

    return (
        <div className={clsx('flex flex-col mt-sm', coupons.length && 'gap-y-sm')}>
            <div className="flex flex-wrap gap-x-xs gap-y-xs">
                {coupons.map(({ code: coupon, isInvalid: isError }) => (
                    <Chip
                        key={coupon}
                        label={coupon}
                        onClick={() => onAddCoupon(coupon)}
                        trailingElement={<Close />}
                        size={ChipSize.Small}
                        type={isError ? ChipType.Error : undefined}
                    />
                ))}
            </div>

            <div className="flex flex-col items-start gap-y-sm">
                <Input
                    placeholder={'Have a discount code?'}
                    type={InputType.Text}
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCoupon()}
                    onClearInput={() => setCoupon('')}
                    disabled={coupons.length > 0}
                />
                <ButtonUnstyled
                    className="bg-names-gradient-primary bg-clip-text text-transparent bg-[length:200%] enabled:transition-[background-position] enabled:duration-500 enabled:hover:bg-[100%] text-label-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={addCoupon}
                    disabled={!coupon.trim()}
                >
                    + Apply Coupon
                </ButtonUnstyled>
            </div>
        </div>
    );
}
