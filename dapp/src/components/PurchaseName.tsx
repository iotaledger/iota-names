// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType } from '@iota/apps-ui-kit';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useEffect, useState } from 'react';

import { useRegisterNameTransaction } from '@/hooks/useRegisterNameTransaction';
import { useIotaNamesClient } from '@/providers/contexts';

type PurchaseNameProps = {
    name: string;
    onClose: () => void;
};

export function PurchaseName({ name, onClose }: PurchaseNameProps) {
    const { iotaNamesClient } = useIotaNamesClient();

    const account = useCurrentAccount();
    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const [price, setPrice] = useState<number | null>(null);

    const {
        data: registerNameData,
        isPending: isRegisterNamePending,
        error,
    } = useRegisterNameTransaction(account?.address || '', name, price ?? 0, 1);

    const canRegister =
        !!account?.address &&
        !!name &&
        price &&
        !isSendingTransaction &&
        !error &&
        !isRegisterNamePending;

    useEffect(() => {
        iotaNamesClient
            .calculatePrice({
                name,
                years: 1,
                isRegistration: true,
            })
            .then((price) => {
                if (price === null) {
                    throw new Error('Price calculation returned null');
                }
                setPrice(price);
                console.log('Price for name:', price);
            })
            .catch((error) => {
                console.error('Error calculating price:', error);
                setPrice(null);
            });
    }, [name, iotaNamesClient]);

    async function handlePurchase() {
        if (!registerNameData) return;
        // TODO: we should probably re-verify again that the name is still available
        signAndExecuteTransaction(
            {
                transaction: registerNameData.transaction,
            },
            {
                onSuccess: (tx) => {
                    console.log('[Transaction sent]: ', tx);
                },
            },
        )
            .then(() => {
                console.log('Register name transaction has been sent');
                onClose();
            })
            .catch(() => {
                console.error('Register name transaction was not sent');
            });
    }
    return (
        <div className="flex flex-col items-center w-full space-y-4">
            <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                    background: 'rgba(0,0,0,0.3)',
                }}
            >
                <div className="relative bg-white/90 dark:bg-gray-800/90 p-8 rounded shadow-lg min-w-[350px] max-w-[90vw]">
                    <button
                        className="absolute top-4 right-4 text-xl font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white"
                        onClick={onClose}
                        aria-label="Close"
                        type="button"
                    >
                        ×
                    </button>{' '}
                    <div className="text-center font-bold text-lg mb-8">BUY NAME</div>
                    <div className="flex flex-col gap-6">
                        <div className="bg-gray-200/80 dark:bg-gray-700/80 p-4 rounded text-left">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                NAME
                            </div>
                            <div className="font-mono">{name}</div>
                        </div>
                        <div className="bg-gray-200/80 dark:bg-gray-700/80 p-4 rounded text-left">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                REGISTRATION TIME:
                            </div>
                            <div className="font-mono">{'1 YEAR'}</div>
                        </div>
                        <div className="bg-gray-200/80 dark:bg-gray-700/80 p-4 rounded text-left">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                PRICE
                            </div>
                            <div className="font-mono">{price ?? '-'}</div>
                        </div>
                        <Button
                            type={ButtonType.Primary}
                            text="BUY"
                            onClick={handlePurchase}
                            disabled={!canRegister}
                        />
                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {error instanceof Error ? error.message : 'An error occurred'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
