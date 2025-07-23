// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Close } from '@iota/apps-ui-icons';
import { ButtonUnstyled, Chip, ChipSize, Input, InputType } from '@iota/apps-ui-kit';
import { Coupon } from '@iota/iota-names-sdk';
import clsx from 'clsx';
import { useState } from 'react';

type Props = {
    coupons: Coupon[];
    onChange: (coupons: Coupon[]) => void;
};

export function CouponInput({ coupons, onChange }: Props) {
    const [coupon, setCoupon] = useState('');

    function addCoupon() {
        if (!coupon.trim()) return;
        if (coupons.includes(coupon.trim())) return;
        onChange([...coupons, coupon.trim()]);
        setCoupon('');
    }

    return (
        <div className={clsx('flex flex-col', coupons.length > 0 ? 'gap-y-sm' : 'mt-sm')}>
            <div className="flex flex-wrap gap-x-xs gap-y-xs">
                {coupons.map((coupon) => (
                    <Chip
                        key={coupon}
                        label={coupon}
                        onClick={() =>
                            onChange(coupons.filter((newCoupon) => newCoupon !== coupon))
                        }
                        trailingElement={<Close />}
                        size={ChipSize.Small}
                    />
                ))}
            </div>

            <div className="flex flex-col items-start gap-y-sm">
                <Input
                    placeholder="Enter a coupon"
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
                    + New Coupon
                </ButtonUnstyled>
            </div>
        </div>
    );
}
