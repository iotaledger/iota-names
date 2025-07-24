// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Close } from '@iota/apps-ui-icons';
import { ButtonUnstyled, Chip, ChipSize, Input, InputType } from '@iota/apps-ui-kit';
import clsx from 'clsx';
import { useState } from 'react';

type Props = {
    coupons: string[];
    addCoupon: (code: string) => Promise<void>;
};

export function CouponsWrapper({ coupons, addCoupon: onAddCoupon }: Props) {
    const [coupon, setCoupon] = useState<string>('');

    async function addCoupon() {
        const trimmedCoupon = coupon.trim();
        if (!trimmedCoupon || coupons.includes(trimmedCoupon)) return;
        await onAddCoupon(trimmedCoupon);
        setCoupon('');
    }

    return (
        <div className={clsx('flex flex-col mt-sm', coupons.length && 'gap-y-sm')}>
            <div className="flex flex-wrap gap-x-xs gap-y-xs">
                {coupons.map((coupon) => (
                    <Chip
                        key={coupon}
                        label={coupon}
                        onClick={() => onAddCoupon(coupon)}
                        trailingElement={<Close />}
                        size={ChipSize.Small}
                    />
                ))}
            </div>

            <div className="flex flex-col items-start gap-y-sm">
                <Input
                    placeholder={
                        coupons.length === 0 ? 'Enter a coupon code' : 'Add an extra coupon'
                    }
                    type={InputType.Text}
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCoupon()}
                    onClearInput={() => setCoupon('')}
                />
                <ButtonUnstyled
                    className="text-label-md bg-names-gradient-primary bg-clip-text text-transparent"
                    onClick={addCoupon}
                    disabled={!coupon.trim()}
                >
                    + Apply Coupon
                </ButtonUnstyled>
            </div>
        </div>
    );
}
