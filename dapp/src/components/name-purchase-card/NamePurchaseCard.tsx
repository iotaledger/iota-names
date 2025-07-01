// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { ConnectButton } from '@iota/dapp-kit';
import clsx from 'clsx';

import { NamePurchaseStatus } from './namePurchasedCard.enums';
import { STATUS_COLORS, STATUS_LABELS } from './namesPurchaseCard.classes';

interface NamePurchaseCardProps {
    /**
     * The name search
     */
    name: string;
    /**
     * supporting text
     */
    supportingText?: string;
    /**
     * The price of the name
     */
    value?: string;
    /**
     * supporting text of value
     */
    supportingTextValue?: string;
    /**
     * status of the name
     */
    status: NamePurchaseStatus;
    /**
     * multiple links
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
}: NamePurchaseCardProps): React.JSX.Element {
    const bgCard =
        status === NamePurchaseStatus.Unavailable ? 'bg-names-error-20' : 'bg-names-neutral-10';
    const nameColor =
        status === NamePurchaseStatus.Unavailable
            ? 'text-names-error-80'
            : 'text-names-tertiary-80';

    return (
        <div
            className={clsx(
                'group flex h-auto w-full flex-col justify-between rounded-2xl p-md--rs space-y-4',
                bgCard,
            )}
        >
            <div className="flex text-headline-md gap-1">
                <span className="text-names-neutral-50">@</span>
                <h2 className={clsx(nameColor)}>{name}</h2>
            </div>
            <div className="flex justify-between space-x-4 h-auto w-full max-w-[744px]">
                <div className="flex flex-row gap-2 text-body-md">
                    <div className={clsx('text-body-sm', STATUS_COLORS[status])}>
                        {STATUS_LABELS[status]}
                    </div>
                    {supportingText && <p className="text-names-neutral-70">{supportingText}</p>}
                </div>
                <div className="flex flex-row gap-4 items-end group">
                    <div className="flex flex-col">
                        {value && (
                            <div className="flex flex-col items-center">
                                <p className="text-body-lg text-names-neutral-92">{value}</p>
                                {supportingTextValue && (
                                    <p className="text-label-sm text-names-neutral-70">
                                        {supportingTextValue}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hidden group-hover:flex transition-opacity duration-300">
                        {status === NamePurchaseStatus.Connected && children}
                        {status === NamePurchaseStatus.Unconnected && (
                            <ConnectButton connectText="Connect Wallet" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
