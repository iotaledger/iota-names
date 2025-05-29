// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType, Dialog, DialogBody, DialogContent, Header } from '@iota/apps-ui-kit';
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
    const [errorAvailable, setErrorAvailable] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [price, setPrice] = useState<number | null>(null);

    const account = useCurrentAccount();
    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const {
        data: registerNameData,
        isPending: isRegisterNamePending,
        error: errorRegisterName,
    } = useRegisterNameTransaction(account?.address || '', name, price ?? 0, 1);

    const canRegister =
        !!account?.address &&
        !!name &&
        price &&
        !isSendingTransaction &&
        !errorRegisterName &&
        !isRegisterNamePending;

    useEffect(() => {
        // Calculate price
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
            })
            .catch((error) => {
                console.error('Error calculating price:', error);
                setPrice(null);
            });

        // Check availability
        iotaNamesClient
            .getNameRecord(name)
            .then((isAvailable) => {
                if (isAvailable !== null) {
                    setErrorAvailable('Name unavailable');
                    setIsAvailable(false);
                } else {
                    setErrorAvailable(null);
                    setIsAvailable(true);
                }
            })
            .catch((error) => {
                console.error('Error fetching name:', error);
                setErrorAvailable('Error fetching name: ' + error);
                setIsAvailable(false);
            });
    }, [name, iotaNamesClient]);

    async function handlePurchase() {
        if (!registerNameData) return;
        if (!isAvailable) return;
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
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent containerId="overlay-portal-container">
                <Header title="Buy name" onClose={onClose} titleCentered />
                <DialogBody>
                    <div className="flex flex-col items-center gap-y-md">
                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                Name:
                            </span>
                            <span className="text-body-md font-mono">{name}</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                Registration time:
                            </span>
                            <span className="text-body-md font-mono">{'1 year'}</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                Price:
                            </span>
                            <span className="text-body-md font-mono">{price ?? '-'}</span>
                        </div>
                        <div className="flex w-full flex-row gap-x-xs">
                            <Button
                                type={ButtonType.Secondary}
                                text="Cancel"
                                onClick={onClose}
                                fullWidth
                            />
                            <Button
                                type={ButtonType.Primary}
                                text="Buy"
                                onClick={handlePurchase}
                                disabled={!canRegister}
                                fullWidth
                            />
                        </div>
                        {!isAvailable && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {errorAvailable}
                            </div>
                        )}
                        {errorRegisterName && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {errorRegisterName instanceof Error
                                    ? errorRegisterName.message
                                    : 'An error occurred'}
                            </div>
                        )}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
