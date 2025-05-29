// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType, Dialog, DialogBody, DialogContent, Header } from '@iota/apps-ui-kit';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useState } from 'react';

import { useNameRecord } from '@/hooks/useNameRecord';
import { useRegisterNameTransaction } from '@/hooks/useRegisterNameTransaction';

type PurchaseNameProps = {
    name: string;
    onClose: () => void;
};

export function PurchaseName({ name, onClose }: PurchaseNameProps) {
    const account = useCurrentAccount();
    const { data, error } = useNameRecord(name);
    const [purchaseError, setPurchaseError] = useState<string>('');
    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const {
        data: registerNameData,
        isPending: isRegisterNamePending,
        error: errorRegisterName,
    } = useRegisterNameTransaction(
        account?.address || '',
        name,
        data?.type == 'available' ? data?.price : 0,
        1,
    );

    const canRegister =
        !!account?.address &&
        !!name &&
        data?.type === 'available' &&
        data?.price &&
        !isSendingTransaction &&
        !errorRegisterName &&
        !isRegisterNamePending;

    async function handlePurchase() {
        if (!registerNameData || data?.type !== 'available') return;
        try {
            await signAndExecuteTransaction({
                transaction: registerNameData.transaction,
            });
            onClose();
        } catch (e) {
            setPurchaseError('Register name transaction was not sent');
        }
    }

    if (!account?.address || !name) return null;

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
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
                            <span className="text-body-md font-mono">1 year</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                Price:
                            </span>
                            <span className="text-body-md font-mono">
                                {data?.type == 'available' ? data?.price : '-'}
                            </span>
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
                        {purchaseError && typeof purchaseError === 'string' && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {purchaseError}
                            </div>
                        )}
                        {(error instanceof Error || typeof error === 'string') && (
                            <div className="text-red-600 dark:text-red-400 text-sm">
                                {error instanceof Error ? error.message : error}
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
