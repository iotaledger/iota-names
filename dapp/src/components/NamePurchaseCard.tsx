// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import clsx from 'clsx';

import { useCalculatePriceInFiat } from '@/hooks';
import { parseIotaToNanos } from '@/lib/utils';

interface NamePurchaseCardProps {
    name: string;
    statusMessage?: string;
    price?: string;
    priceSymbol?: string;
    priceSupportingText?: string;
    isAvailable: boolean;
    disableHoverEffect?: boolean;
    testId?: string;
}

export function NamePurchaseCard({
    name,
    statusMessage,
    price,
    priceSupportingText,
    isAvailable,
    priceSymbol,
    children,
    disableHoverEffect,
    testId,
}: React.PropsWithChildren<NamePurchaseCardProps>): React.JSX.Element {
    const bgCard = isAvailable ? 'bg-names-neutral-10' : 'bg-names-error-20';
    const textColorStatus = isAvailable ? 'text-names-tertiary-80' : 'text-names-error-80';
    const textStatus = isAvailable ? 'Available' : 'Unavailable';
    const defaultPriceSymbol = priceSymbol ?? 'IOTA';
    const priceInNanos = parseIotaToNanos(price || '0');
    const fiatPrice = useCalculatePriceInFiat(priceInNanos);

    const [_, nameWithOutAt] = normalizeIotaName(name).split('@');
    return (
        <div
            className={clsx(
                'group relative w-full flex flex-col justify-between rounded-2xl p-[1px] gap-y-sm',
                isAvailable && 'hover:bg-names-gradient-primary',
            )}
            data-testid={testId}
        >
            <div
                className={clsx(
                    'group flex h-full w-full flex-col justify-between rounded-[15px] p-md--rs gap-y-sm',
                    bgCard,
                )}
            >
                <div className="flex text-headline-sm sm:text-headline-md gap-xxs">
                    <span className="text-names-neutral-50">@</span>
                    <h2 className={clsx('truncate w-full overflow-hidden', textColorStatus)}>
                        {nameWithOutAt}
                    </h2>
                </div>
                <div className="flex justify-between space-x-4 h-auto w-full">
                    <div className="flex flex-row gap-2 text-body-md items-center min-h-12">
                        <div className={clsx('text-body-md', textColorStatus)}>{textStatus}</div>
                        {statusMessage && (
                            <p
                                className={clsx(
                                    'text-names-neutral-70 transition-opacity duration-100',
                                    isAvailable
                                        ? 'opacity-100'
                                        : disableHoverEffect
                                          ? 'opacity-100'
                                          : 'opacity-0 group-hover:opacity-100',
                                )}
                            >
                                {statusMessage}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-row gap-md">
                        {price && (
                            <div className="flex flex-col items-start">
                                <div className="flex items-baseline gap-md">
                                    <p className="text-body-lg text-names-neutral-92 flex items-baseline gap-xxs font-bold">
                                        {price}
                                        <span className="text-names-neutral-70">
                                            {defaultPriceSymbol}
                                        </span>
                                    </p>
                                    {fiatPrice && (
                                        <span className="text-label-sm text-names-neutral-50 items-center flex mr-md">
                                            (${fiatPrice} USD)
                                        </span>
                                    )}
                                </div>
                                {priceSupportingText && (
                                    <p className="text-label-sm text-names-neutral-70">
                                        {priceSupportingText}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="flex w-0 group-hover:w-auto whitespace-nowrap overflow-hidden">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
