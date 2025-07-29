// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Warning } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonType,
    Checkbox,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    DisplayStats,
    Header,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    LoadingIndicator,
    Panel,
    Select,
    SelectOption,
    Toggle,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useIotaNamesClient } from '@/contexts';
import { NameUpdate, queryKey, useBalanceValidation, useUpdateNameTransaction } from '@/hooks';
import { useCoreConfig } from '@/hooks/useCoreConfig';
import { useNameRecord } from '@/hooks/useNameRecord';
import {
    GAS_BALANCE_TOO_LOW_ID,
    GAS_BUDGET_ERROR_MESSAGES,
    NOT_ENOUGH_BALANCE_ID,
} from '@/lib/constants';
import { formatNanosToIota } from '@/lib/utils';
import { getTargetExpirationDate } from '@/lib/utils/names';

import { CouponsWrapper } from '../CouponsWrapper';

export interface UserSetCoupon {
    code: string;
    isInvalid?: boolean;
}

type PurchaseNameProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
    onPurchase?: () => void;
};

export function PurchaseNameDialog({ name, open, setOpen, onPurchase }: PurchaseNameProps) {
    const queryClient = useQueryClient();
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();

    const account = useCurrentAccount();
    const { data: coreConfig } = useCoreConfig();

    const [renewYears, setRenewYears] = useState<number>(1);
    const [isDisplayName, setIsDisplayName] = useState<boolean>(false);
    const [coupons, setCoupons] = useState<UserSetCoupon[]>([]);
    const [applyCoupons, setApplyCoupons] = useState(false);

    const couponCodes = coupons.map((c) => c.code);

    const {
        data: nameRecordData,
        isLoading: isNameRecordLoading,
        error: nameRecordError,
    } = useNameRecord(name, {
        price: {
            years: renewYears,
            isRegistration: true,
        },
    });

    const price = nameRecordData?.type === 'available' ? nameRecordData?.price : 0;
    const isConnected = !!account?.address;

    const updates: NameUpdate[] = [];

    if (nameRecordData?.type === 'available' && price > 0) {
        updates.push({
            type: 'register-name',
            name: name,
            price: price,
            years: renewYears,
            setDefault: isDisplayName,
            address: account?.address,
            ...(applyCoupons && coupons.length ? { couponCodes } : {}),
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
            toast.success(
                `Successfully registered name ${normalizeIotaName(name, 'at', { truncateLongParts: true })}`,
            );
            setOpen(false);

            if (onPurchase) onPurchase();
        },
        onError(error) {
            toast.error(error.message);
        },
    });

    function closeDialog() {
        setOpen(false);
    }

    if (!isConnected) return null;

    const RENEW_OPTIONS: SelectOption[] = coreConfig?.max_years
        ? Array.from({ length: coreConfig?.max_years }, (_, i) => ({
              id: String(i + 1),
              label: `${i + 1} Year${i ? 's' : ''}`,
          }))
        : [];

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

    const expirationDate = getTargetExpirationDate(renewYears);

    const handleErroredCoupon = useCallback((erroredCoupon: string) => {
        setCoupons((currentCoupons) =>
            currentCoupons.map((c) => (c.code === erroredCoupon ? { ...c, isInvalid: true } : c)),
        );
    }, []);

    useEffect(() => {
        if (nameRecordError) {
            toast.error(nameRecordError.message);
        }
    }, [nameRecordError]);

    useEffect(() => {
        if (updateNameError) {
            if (
                updateNameError.message.includes(GAS_BALANCE_TOO_LOW_ID) ||
                updateNameError.message.includes(NOT_ENOUGH_BALANCE_ID)
            ) {
                toast.error(GAS_BUDGET_ERROR_MESSAGES[GAS_BALANCE_TOO_LOW_ID]);
            } else {
                const couponRegex = /^Coupon '([^']*)' validation failed/;
                const couponMatch = updateNameError.message.match(couponRegex)?.[1];

                if (couponMatch) {
                    handleErroredCoupon(couponMatch);
                }

                toast.error(updateNameError.message);
            }
        }
    }, [updateNameError, handleErroredCoupon]);

    const [discountedPrice, setDiscountedPrice] = useState(balanceValidation?.totalPrice);

    useEffect(() => {
        if (!applyCoupons || couponCodes.length === 0) {
            setDiscountedPrice(balanceValidation?.totalPrice);
            return;
        }
        iotaNamesClient
            .calculateDiscountedPrice({
                coupons: couponCodes,
                name,
                years: renewYears,
                isRegistration: true,
            })
            .then(setDiscountedPrice)
            .catch(() => setDiscountedPrice(balanceValidation?.totalPrice));
    }, [applyCoupons, couponCodes, renewYears, balanceValidation?.totalPrice]);

    async function handleAddCoupon(couponCode: string) {
        if (couponCodes.includes(couponCode)) {
            setCoupons((currentCoupons) =>
                currentCoupons.filter((existingCoupon) => existingCoupon.code !== couponCode),
            );
            return;
        }

        try {
            const resolvedCoupon = await iotaNamesClient.resolveCoupon(couponCode);
            if (!resolvedCoupon) {
                throw new Error();
            }
            setCoupons((currentCoupons) => [...currentCoupons, { code: couponCode }]);
        } catch {
            toast.error('Invalid coupon');
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header title="Register name" onClose={closeDialog} />
                <DialogBody>
                    <div className="flex flex-col justify-between h-full items-center">
                        <div className="flex flex-col w-full gap-y-md">
                            <Panel bgColor="bg-names-neutral-12">
                                <div className="px-md py-lg">
                                    <span className="text-names-neutral-100 text-headline-sm break-words overflow-hidden">
                                        {normalizeIotaName(name)}
                                    </span>
                                </div>
                            </Panel>

                            <Select
                                value={renewYears.toString()}
                                options={RENEW_OPTIONS}
                                onValueChange={(value) => {
                                    setRenewYears(parseInt(value, 10));
                                }}
                                placeholder="Select renewal period"
                            />
                            <div className="flex flex-col">
                                <div className="self-end">
                                    <Toggle
                                        isToggled={applyCoupons}
                                        onChange={setApplyCoupons}
                                        label="Add Coupons"
                                    />
                                </div>
                                {applyCoupons && (
                                    <CouponsWrapper
                                        coupons={coupons}
                                        onAddCoupon={handleAddCoupon}
                                    />
                                )}
                            </div>
                            {!hasEnoughGas && (
                                <InfoBox
                                    title="Error"
                                    supportingText={
                                        GAS_BUDGET_ERROR_MESSAGES[GAS_BALANCE_TOO_LOW_ID]
                                    }
                                    icon={<Warning />}
                                    type={InfoBoxType.Error}
                                    style={InfoBoxStyle.Elevated}
                                />
                            )}
                        </div>
                        <div className="flex flex-col w-full gap-y-md">
                            <Panel bgColor="bg-names-neutral-10">
                                <div className="flex flex-row gap-x-sm w-full p-md">
                                    <Checkbox
                                        isChecked={isDisplayName}
                                        onCheckedChange={(e) => setIsDisplayName(e.target.checked)}
                                        label="Set name as Display Name"
                                    />
                                </div>
                            </Panel>

                            <div className="flex flex-row gap-x-sm w-full">
                                <DisplayStats label="Registration Expires" value={expirationDate} />
                                <DisplayStats
                                    label="Total Due"
                                    value={
                                        !isLoading &&
                                        balanceValidation &&
                                        typeof balanceValidation?.totalPrice === 'number' &&
                                        balanceValidation.totalPrice > 0 &&
                                        discountedPrice ? (
                                            formatNanosToIota(discountedPrice)
                                        ) : (
                                            <LoadingIndicator />
                                        )
                                    }
                                />
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
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
