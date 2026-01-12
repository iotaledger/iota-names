// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import clsx from 'clsx';

import { useCalculatePriceInFiat } from '@/hooks';
import { formatNanosToIota } from '@/lib/utils';

import { BG_COLORS, TEXT_COLORS } from './constants';
import { NameAvailabilityStatus } from './enums';

interface NamePurchaseCardProps {
    name: string;
    statusMessage?: string;
    priceNanos?: number | bigint;
    priceSymbol?: string;
    priceSupportingText?: string;
    status: NameAvailabilityStatus;
    disableStatusHoverEffect?: boolean;
    testId?: string;
}

export function NamePurchaseCard({
    name,
    statusMessage,
    priceNanos,
    priceSupportingText,
    status,
    priceSymbol,
    children,
    disableStatusHoverEffect,
    testId,
}: React.PropsWithChildren<NamePurchaseCardProps>): React.JSX.Element {
    const bgCard = BG_COLORS[status];

    const textColorStatus = TEXT_COLORS[status];
    const defaultPriceSymbol = priceSymbol ?? 'IOTA';
    const fiatPrice = useCalculatePriceInFiat(priceNanos || 0);
    const formattedPrice = priceNanos
        ? formatNanosToIota(priceNanos, {
              showIotaSymbol: false,
          })
        : undefined;

    const isAvailable = status === NameAvailabilityStatus.Available;

    const [_, nameWithOutAt] = normalizeIotaName(name).split('@');
    return (
        <div
            className={clsx(
                'group relative w-full flex flex-col justify-between rounded-2xl p-[1px] gap-y-sm ',
                status !== NameAvailabilityStatus.Unavailable && 'hover:bg-names-gradient-primary',
            )}
            data-testid={testId}
        >
            <div
                className={clsx(
                    'group flex h-full w-full flex-col justify-between rounded-[15px] p-md--rs gap-y-sm',
                    bgCard,
                )}
            >
                <div
                    className="flex text-headline-sm sm:text-headline-md gap-xxs"
                    data-testid="name-purchase-card-name"
                >
                    <span className="text-names-neutral-50">@</span>
                    <h2 className={clsx('truncate w-full overflow-hidden', textColorStatus)}>
                        {nameWithOutAt}
                    </h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:space-x-4 h-auto w-full">
                    <div className="flex flex-row gap-2 text-body-md items-center min-h-12">
                        <div
                            className={clsx('text-body-md capitalize', textColorStatus)}
                            data-testid="name-purchase-card-status"
                        >
                            {status}
                        </div>
                        {statusMessage && (
                            <p
                                data-testid="name-purchase-card-status-message"
                                className={clsx(
                                    'text-names-neutral-70 transition-opacity duration-100',
                                    isAvailable
                                        ? 'opacity-100'
                                        : disableStatusHoverEffect
                                          ? 'opacity-100'
                                          : 'opacity-0 group-hover:opacity-100',
                                )}
                            >
                                {statusMessage}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap sm:flex-row gap-xs sm:gap-md">
                        {priceNanos && (
                            <div className="flex flex-col items-start">
                                <div className="flex items-baseline gap-md">
                                    <p className="text-body-lg text-names-neutral-92 flex items-baseline gap-xxs font-bold">
                                        {formattedPrice}
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
                        <div className="flex flex-col sm:flex-row w-0 group-hover:w-auto whitespace-nowrap overflow-hidden">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
