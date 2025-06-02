// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType, Dialog, DialogBody, DialogContent, Header } from '@iota/apps-ui-kit';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { IOTA_TYPE_ARG } from '@iota/iota-sdk/utils';
import { useState } from 'react';

import { useGetCoins } from '@/hooks/useGetCoins';
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

    const isAvailable = nameRecordData?.type === 'available';
    const price = isAvailable ? nameRecordData?.price : 0;
    const isConnected = !!account?.address;

    const {
        data: registerNameData,
        isLoading: isRegisterNameLoading,
        error: registerNameError,
    } = useRegisterNameTransaction(account?.address || '', name, price);

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { data: userCoins, error: errorUserBalance } = useGetCoins(
        IOTA_TYPE_ARG,
        account?.address ?? null,
    );
    const userBalance = Number(userCoins?.pages?.[0]?.data?.[0]?.balance) || 0;
    const gas = Number(registerNameData?.gasSummary?.totalGas);
    const priceValue = isAvailable ? nameRecordData.price : 0;
    const totalPrice = isAvailable ? priceValue + gas : '-';
    const hasBalance = (userBalance ?? 0) > Number(totalPrice);
    const isNotEnoughGas =
        registerNameError &&
        (registerNameError.message.includes(NOT_ENOUGH_BALANCE_ID) ||
            registerNameError.message.includes(GAS_BALANCE_TOO_LOW_ID));

    const canRegister =
        isConnected &&
        isAvailable &&
        !registerNameError &&
        !isSendingTransaction &&
        !isRegisterNameLoading &&
        !isNotEnoughGas &&
        hasBalance &&
        !errorUserBalance;

    async function handlePurchase() {
        if (!registerNameData || !isAvailable) return;
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
                                {isAvailable
                                    ? formatNanosToIota(price, { formatRounded: false })
                                    : '-'}{' '}
                            </span>
                        </div>
                        {!isRegisterNameLoading && registerNameData && (
                            <div className="flex items-baseline justify-center gap-x-1">
                                <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                    Gas:
                                </span>
                                <span className="text-body-md font-mono">
                                    {formatNanosToIota(
                                        registerNameData?.gasSummary?.totalGas ?? '0',
                                        { formatRounded: false },
                                    )}
                                </span>
                            </div>
                        )}
                        {!isRegisterNameLoading &&
                            !isNameRecordLoading &&
                            isAvailable &&
                            registerNameData && (
                                <div className="flex items-baseline justify-center gap-x-1">
                                    <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                        Total price (Name + gas):
                                    </span>
                                    <span className="text-body-md font-mono">
                                        {isAvailable && !isNameRecordLoading
                                            ? formatNanosToIota(totalPrice, {
                                                  formatRounded: false,
                                              })
                                            : '-'}
                                    </span>
                                </div>
                            )}

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
                        {isNotEnoughGas && (
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
                        {!isNotEnoughGas && registerNameError && (
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
