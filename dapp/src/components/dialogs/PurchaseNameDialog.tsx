// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { NameUpdate, queryKey, useUpdateNameTransaction } from '@/hooks';
import { useBalance } from '@/hooks/useBalance';
import { useNameRecord } from '@/hooks/useNameRecord';
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
    const queryClient = useQueryClient();
    const client = useIotaClient();
    const account = useCurrentAccount();
    const {
        data: nameRecordData,
        isLoading: isNameRecordLoading,
        error: nameRecordError,
    } = useNameRecord(name);

    const price = nameRecordData?.type === 'available' ? nameRecordData?.price : 0;
    const isConnected = !!account?.address;

    const updates: NameUpdate[] = [];

    if (nameRecordData?.type === 'available' && price > 0) {
        updates.push({
            type: 'register-name',
            name: name,
            price: price,
            years: 1,
        });
    }

    const {
        data: updateNameData,
        isLoading: isUpdateNameLoading,
        error: updateNameError,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        updates: updates,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { data: coinBalance, error: coinBalanceError } = useBalance(account?.address ?? '');

    const {
        mutateAsync: handlePurchase,
        error: purchaseError,
        isPending: isSigning,
    } = useMutation({
        async mutationFn() {
            if (!updateNameData || nameRecordData?.type !== 'available') return;
            const transactionResult = await signAndExecuteTransaction({
                transaction: updateNameData.transaction,
            });

            await client.waitForTransaction({
                digest: transactionResult.digest,
            });
        },
        onSuccess() {
            queryClient.invalidateQueries({
                queryKey: queryKey.ownedObjects(account?.address || ''),
            });

            setOpen(false);

            if (onPurchase) onPurchase();
        },
    });

    function closeDialog() {
        setOpen(false);
    }

    if (!isConnected) return null;

    const totalBalance = Number(coinBalance?.totalBalance) || 0;
    const totalGas = Number(updateNameData?.gasSummary?.totalGas) || 0;
    const totalPrice = nameRecordData?.type === 'available' ? nameRecordData.price + totalGas : 0;
    const hasBalance = totalBalance > totalPrice;

    const hasEnoughGas =
        !updateNameError?.message.includes(NOT_ENOUGH_BALANCE_ID) &&
        !updateNameError?.message.includes(GAS_BALANCE_TOO_LOW_ID);

    const canPay =
        isConnected && hasEnoughGas && hasBalance && nameRecordData?.type === 'available';

    const hasErrors = updateNameError || coinBalanceError || purchaseError;

    const isLoading = isNameRecordLoading || isUpdateNameLoading || isSigning;

    const canRegister = canPay && !hasErrors && !isLoading && !isSendingTransaction;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" isFixedPosition>
                <Header title="Buy name" onClose={closeDialog} titleCentered />
                <DialogBody>
                    <div className="flex flex-col items-center gap-y-md">
                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-60">Name:</span>
                            <span className="text-body-md font-mono">{name}</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-60">Registration time:</span>
                            <span className="text-body-md font-mono">1 year</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-60">Price:</span>
                            <span className="text-body-md font-mono">
                                {!isLoading && canPay
                                    ? formatNanosToIota(nameRecordData.price, {
                                          formatRounded: false,
                                      })
                                    : '-'}
                            </span>
                        </div>

                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-60">Gas:</span>
                            <span className="text-body-md font-mono">
                                {!isLoading
                                    ? formatNanosToIota(totalGas, { formatRounded: false })
                                    : '-'}
                            </span>
                        </div>

                        <div className="flex items-baseline justify-center gap-x-1">
                            <span className="text-body-md text-neutral-60">
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
                                icon={isLoading ? <LoadingIndicator /> : null}
                                type={ButtonType.Primary}
                                text="Buy"
                                onClick={() => handlePurchase()}
                                disabled={!canRegister}
                                fullWidth
                            />
                        </div>
                        {!hasEnoughGas && (
                            <div className="text-center text-red-400 text-sm">
                                {GAS_BUDGET_ERROR_MESSAGES[GAS_BALANCE_TOO_LOW_ID]}
                            </div>
                        )}
                        {purchaseError && (
                            <div className="text-center text-red-400 text-sm">
                                {purchaseError.message}
                            </div>
                        )}
                        {nameRecordError && (
                            <div className="text-center text-red-400 text-sm">
                                {nameRecordError.message}
                            </div>
                        )}
                        {hasEnoughGas && updateNameError && (
                            <div className="text-center text-red-400 text-sm">
                                {updateNameError.message}
                            </div>
                        )}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
