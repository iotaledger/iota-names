// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType, Dialog, DialogBody, DialogContent, Header } from '@iota/apps-ui-kit';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useState } from 'react';

import { useNameRecord } from '@/hooks/useNameRecord';
import { useRegisterNameTransaction } from '@/hooks/useRegisterNameTransaction';
import { formatNanosToIota } from '@/lib/utils';

type PurchaseNameProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
    onPurchase?: () => void;
};

export function PurchaseNameDialog({ name, open, setOpen, onPurchase }: PurchaseNameProps) {
    const account = useCurrentAccount();
    const { data, error } = useNameRecord(name);

    const [purchaseError, setPurchaseError] = useState<string>('');

    const price = data?.type === 'available' ? data?.price : 0;
    const isConnected = !!account?.address;

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const {
        data: registerNameData,
        isLoading: isRegisterNameLoading,
        error: registerNameError,
    } = useRegisterNameTransaction(account?.address || '', name, price);

    const canRegister =
        isConnected &&
        data?.type === 'available' &&
        !registerNameError &&
        !isSendingTransaction &&
        !isRegisterNameLoading;

    async function handlePurchase() {
        if (!registerNameData || data?.type !== 'available') return;
        try {
            await signAndExecuteTransaction({
                transaction: registerNameData.transaction,
            });
            setOpen(false);
            if (onPurchase) onPurchase();
        } catch (e) {
            setPurchaseError('Register name transaction was not sent');
        }
    }

    function closeDialog() {
        setOpen(false);
    }

    if (!isConnected) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title="Buy name" onClose={closeDialog} titleCentered />
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
                            <span className="text-body-md font-mono">1 year</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                Price:
                            </span>
                            <span className="text-body-md font-mono">
                                {data?.type === 'available'
                                    ? formatNanosToIota(BigInt(data.price))
                                    : '-'}
                            </span>
                        </div>
                        <div className="flex w-full flex-row gap-x-xs">
                            <Button
                                type={ButtonType.Secondary}
                                text="Cancel"
                                onClick={closeDialog}
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
                        {purchaseError && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {purchaseError}
                            </div>
                        )}
                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {error.message}
                            </div>
                        )}
                        {registerNameError && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {registerNameError.message}
                            </div>
                        )}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
