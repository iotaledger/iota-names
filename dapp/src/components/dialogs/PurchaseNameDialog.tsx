// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType, Dialog, DialogBody, DialogContent, Header } from '@iota/apps-ui-kit';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useState } from 'react';

import { useBalance } from '@/hooks/useBalance';
import { useNameRecord } from '@/hooks/useNameRecord';
import { useRegisterNameTransaction } from '@/hooks/useRegisterNameTransaction';
import {
    GAS_BALANCE_TOO_LOW_ID,
    GAS_BUDGET_ERROR_MESSAGES,
    NOT_ENOUGH_BALANCE_ID,
} from '@/lib/constants';
import { formatNanosToIota } from '@/lib/utils';

type PurchaseNameProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
    onPurchase?: () => void;
};

export function PurchaseNameDialog({ name, open, setOpen, onPurchase }: PurchaseNameProps) {
    const account = useCurrentAccount();
    const {
        data: nameRecordData,
        isLoading: isNameRecordLoading,
        error: nameRecordError,
    } = useNameRecord(name);
    const [purchaseError, setPurchaseError] = useState<string>('');

    const price = nameRecordData?.type === 'available' ? nameRecordData?.price : 0;
    const isConnected = !!account?.address;

    const {
        data: registerNameData,
        isLoading: isRegisterNameLoading,
        error: registerNameError,
    } = useRegisterNameTransaction(account?.address || '', name, price);

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { data: coinBalance, error: coinBalanceError } = useBalance(account?.address ?? '');

    async function handlePurchase() {
        if (!registerNameData || nameRecordData?.type !== 'available') return;
        try {
            setPurchaseError('');
            // TODO https://github.com/iotaledger/iota/issues/7286 - UnsupportedMethodError: Method iota_executeTransactionBlock is not supported in the GraphQL API
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

    const totalBalance = Number(coinBalance?.totalBalance) || 0;
    const totalGas = Number(registerNameData?.gasSummary?.totalGas) || 0;
    const totalPrice = nameRecordData?.type === 'available' ? nameRecordData.price + totalGas : 0;
    const hasBalance = totalBalance > totalPrice;

    const hasEnoughGas =
        !registerNameError?.message.includes(NOT_ENOUGH_BALANCE_ID) &&
        !registerNameError?.message.includes(GAS_BALANCE_TOO_LOW_ID);

    const canPay =
        isConnected && hasEnoughGas && hasBalance && nameRecordData?.type === 'available';

    const hasErrors = registerNameError || coinBalanceError;

    const isLoading = isNameRecordLoading || isRegisterNameLoading;

    const canRegister = canPay && !hasErrors && !isLoading && !isSendingTransaction;

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
                                {!isLoading && canPay
                                    ? formatNanosToIota(nameRecordData.price, {
                                          formatRounded: false,
                                      })
                                    : '-'}
                            </span>
                        </div>

                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                Gas:
                            </span>
                            <span className="text-body-md font-mono">
                                {!isLoading
                                    ? formatNanosToIota(totalGas, { formatRounded: false })
                                    : '-'}
                            </span>
                        </div>

                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                Total price (Name + gas):
                            </span>
                            <span className="text-body-md font-mono">
                                {!isLoading
                                    ? formatNanosToIota(totalPrice, {
                                          formatRounded: false,
                                      })
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
                        {!hasEnoughGas && (
                            <div className="text-center text-red-600 dark:text-red-400 text-sm">
                                {GAS_BUDGET_ERROR_MESSAGES[GAS_BALANCE_TOO_LOW_ID]}
                            </div>
                        )}
                        {purchaseError && (
                            <div className="text-center text-red-600 dark:text-red-400 text-sm">
                                {purchaseError}
                            </div>
                        )}
                        {nameRecordError && (
                            <div className="text-center text-red-600 dark:text-red-400 text-sm">
                                {nameRecordError.message}
                            </div>
                        )}
                        {hasEnoughGas && registerNameError && (
                            <div className="text-center text-red-600 dark:text-red-400 text-sm">
                                {registerNameError.message}
                            </div>
                        )}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
