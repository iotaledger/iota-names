// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import clsx from 'clsx';

import { NamePurchaseStatus } from './namePurchasedCard.enums';

interface NamePurchaseCardProps {
    /**
     * The name search
     */
    name: string;
    /**
     * Optional status message
     */
    supportingText?: string;
    /**
     * The price of the name
     */
    value?: string;
    /**
     * Currency symbol
     */
    currency?: string;
    /**
     * Supporting text of value
     */
    supportingTextValue?: string;
    /**
     * Name status
     */
    status: NamePurchaseStatus;
    /**
     * Action buttons
     */
    children?: React.ReactNode;
}

export function NamePurchaseCard({
    name,
    supportingText,
    value,
    supportingTextValue,
    status,
    children,
    currency,
}: NamePurchaseCardProps): React.JSX.Element {
    const bgCard =
        status === NamePurchaseStatus.Unavailable ? 'bg-names-error-20' : 'bg-names-neutral-10';
    const textColorStatus =
        status === NamePurchaseStatus.Unavailable
            ? 'text-names-error-80'
            : 'text-names-tertiary-80';
    const textStatus = status === NamePurchaseStatus.Unavailable ? 'Unavailable' : 'Available';
    const hasCurrency = currency ?? 'IOTA';

    return (
        <div
            className={clsx(
                'group relative w-full flex flex-col justify-between rounded-2xl p-[1px] space-y-4',
                status !== NamePurchaseStatus.Unavailable && 'hover:bg-names-primary-30',
            )}
        >
            <div
                className={clsx(
                    'group flex h-full w-full flex-col justify-between rounded-[calc(1rem-1px)] p-md--rs space-y-4',
                    bgCard,
                )}
            >
                <div className="flex text-headline-md gap-1">
                    <span className="text-names-neutral-50">@</span>
                    <h2 className={clsx(textColorStatus)}>{name}</h2>
                </div>
                <div className="flex justify-between space-x-4 h-auto w-full max-w-[744px]">
                    <div className="flex flex-row gap-2 text-body-md items-center">
                        <div className={clsx('text-body-sm', textColorStatus)}>{textStatus}</div>
                        {supportingText && (
                            <p
                                className={clsx(
                                    'text-names-neutral-70 transition-opacity duration-100',
                                    status === NamePurchaseStatus.Unavailable
                                        ? 'opacity-0 group-hover:opacity-100'
                                        : 'opacity-100',
                                )}
                            >
                                {supportingText}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-row gap-md group">
                        <div className="flex flex-col">
                            {value && (
                                <div className="flex flex-col items-start">
                                    <p className="text-body-lg text-names-neutral-92 flex items-baseline gap-1">
                                        {value}
                                        <span className="text-names-neutral-70">{hasCurrency}</span>
                                    </p>
                                    {supportingTextValue && (
                                        <p className="text-label-sm text-names-neutral-70">
                                            {supportingTextValue}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className=" group-hover:flex transition-opacity duration-100 w-0 group-hover:w-auto whitespace-nowrap overflow-hidden">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
