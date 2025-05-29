// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonSize,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
} from '@iota/apps-ui-kit';
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
                console.log('Price for name:', price); // REMOVE
            })
            .catch((error) => {
                //toast.error('Error calculating price:', error);
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
                    //toast.success('[Transaction sent]: ', tx);
                    console.log('[Transaction sent]: ', tx);
                },
            },
        )
            .then(() => {
                // toast.success('Register name transaction has been sent');
                console.log('Register name transaction has been sent');

                onClose();
            })
            .catch(() => {
                // toast.error('Register name transaction was not sent');
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
                                size={ButtonSize.Medium}
                                text="Cancel"
                                onClick={onClose}
                                fullWidth
                            />
                            <Button
                                type={ButtonType.Primary}
                                size={ButtonSize.Medium}
                                text="Buy"
                                onClick={handlePurchase}
                                disabled={!canRegister}
                            />
                        </div>
                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {error instanceof Error ? error.message : 'An error occurred'}
                            </div>
                        )}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
