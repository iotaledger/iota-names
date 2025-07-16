// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    DisplayStats,
    Header,
    LoadingIndicator,
    Panel,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { NameUpdate, queryKey, useBalanceValidation, useUpdateNameTransaction } from '@/hooks';
import { useNameRecord } from '@/hooks/useNameRecord';
import {
    GAS_BALANCE_TOO_LOW_ID,
    GAS_BUDGET_ERROR_MESSAGES,
    NOT_ENOUGH_BALANCE_ID,
} from '@/lib/constants';
import { formatNanosToIota } from '@/lib/utils';
import { normalizeNameInput } from '@/lib/utils/format/formatNames';
import { getDefaultExpirationDate } from '@/lib/utils/getDefaultExpirationDate';

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

    const { data: balanceValidation, error: balanceValidationError } = useBalanceValidation(
        updateNameData?.builtTx ?? null,
        price,
    );

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

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

    const hasEnoughGas =
        !updateNameError?.message.includes(NOT_ENOUGH_BALANCE_ID) &&
        !updateNameError?.message.includes(GAS_BALANCE_TOO_LOW_ID);

    const canPay =
        isConnected &&
        hasEnoughGas &&
        balanceValidation?.hasBalance &&
        nameRecordData?.type === 'available';

    const hasErrors = updateNameError || balanceValidationError || purchaseError;

    const isLoading = isNameRecordLoading || isUpdateNameLoading || isSigning;

    const canRegister = canPay && !hasErrors && !isLoading && !isSendingTransaction;

    const cleanName = normalizeNameInput(name);
    const expirationDate = getDefaultExpirationDate();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header title="Register name" onClose={closeDialog} />
                <DialogBody>
                    <div className="flex flex-col justify-between h-full items-center">
                        <div className="flex flex-col w-full gap-y-md">
                            <Panel bgColor="bg-names-neutral-12">
                                <div className="px-md py-lg">
                                    <span className="text-names-neutral-100 text-headline-sm">
                                        @{cleanName}
                                    </span>
                                </div>
                            </Panel>
                        </div>
                        <div className="flex flex-col w-full gap-y-md">
                            <div className="flex flex-row gap-x-sm w-full">
                                {!isLoading && balanceValidation?.totalPrice && (
                                    <>
                                        <DisplayStats
                                            label="Registration Expires"
                                            value={expirationDate}
                                        />
                                        <DisplayStats
                                            label="Total Due"
                                            value={formatNanosToIota(balanceValidation.totalPrice)}
                                        />
                                    </>
                                )}
                            </div>
                            <div className="flex w-full flex-row gap-x-xs mt-xs">
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
