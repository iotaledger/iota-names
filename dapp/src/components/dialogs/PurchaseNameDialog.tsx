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
    LabelText,
    LoadingIndicator,
    Panel,
    Select,
    SelectOption,
    Toggle,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useIotaNamesClient } from '@/contexts';
import {
    NameUpdate,
    queryKey,
    useBalance,
    useCalculatePriceInFiat,
    useUpdateNameTransaction,
} from '@/hooks';
import { useIsMethodSupported } from '@/hooks/useIsMethodSupported';
import { useNameRecord } from '@/hooks/useNameRecord';
import { useNamesConfig } from '@/hooks/useNamesConfig';
import { formatNanosToIota, getUserFriendlyErrorMessage } from '@/lib/utils';
import { ampli } from '@/lib/utils/analytics/ampli';
import { getTargetExpirationDate } from '@/lib/utils/names';

import { CouponInputSelection } from '../CouponInputSelection';

export interface UserSetCoupon {
    code: string;
    isInvalid?: boolean;
}

type PurchaseNameProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
    onCompleted?: () => void;
};

export function PurchaseNameDialog({ name, open, setOpen, onCompleted }: PurchaseNameProps) {
    const queryClient = useQueryClient();
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    const { data: config, isLoading: isLoadingConfig } = useNamesConfig();

    const account = useCurrentAccount();

    const { data: coinBalance, error: coinBalanceError } = useBalance(account?.address ?? '');
    const [isDisplayName, setIsDisplayName] = useState<boolean>(false);
    const [coupons, setCoupons] = useState<UserSetCoupon[]>([]);
    const [applyCoupons, setApplyCoupons] = useState(false);
    const [purchaseYears, setPurchaseYears] = useState<number>(1);
    const { data: isRegisterWithYearsSupported, isLoading: isLoadingRegisterWithYears } =
        useIsMethodSupported({
            packageId: iotaNamesClient.getPackage('packageId'),
            module: 'payment',
            functionName: 'init_registration_with_years',
        });

    const couponCodes = coupons.map((c) => c.code);

    const {
        data: nameRecordData,
        isLoading: isNameRecordLoading,
        error: nameRecordError,
    } = useNameRecord(name, {
        price: {
            years: purchaseYears,
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
            years: isRegisterWithYearsSupported ? purchaseYears : undefined,
            price: price,
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

    const applyDiscount = applyCoupons && couponCodes.length >= 0;

    const { data: discountedPrice, isLoading: isDiscountedPriceLoading } = useQuery({
        queryKey: [couponCodes, name, account?.address, purchaseYears],
        async queryFn() {
            return await iotaNamesClient.calculateDiscountedPrice({
                coupons: couponCodes,
                name,
                years: purchaseYears,
                isRegistration: true,
                address: account?.address,
            });
        },
        enabled: applyDiscount,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { mutateAsync: handlePurchase, isPending: isSigning } = useMutation({
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
            queryClient.removeQueries({
                queryKey: queryKey.nameRecord(name),
            });
            queryClient.invalidateQueries({
                queryKey: queryKey.defaultName(account?.address || ''),
            });

            ampli.purchasedName({
                name,
                amount: price ?? 0,
                expiration: purchaseYears,
                discountName: couponCodes.join(','),
                discountPercentage: applyDiscount ? (price - (discountedPrice ?? 0)) / price : 0,
            });

            if (isDisplayName) {
                ampli.setNameAsDisplayed({ name });
            }

            toast.success(
                `Successfully registered name ${normalizeIotaName(name, 'at', { truncateLongParts: true })}`,
            );
            setOpen(false);

            onCompleted?.();
        },
        onError(error) {
            toast.error(getUserFriendlyErrorMessage(error));
        },
    });

    useEffect(() => {
        if (nameRecordError) {
            toast.error(nameRecordError.message);
        }
    }, [nameRecordError]);

    useEffect(() => {
        const handleErroredCoupon = (erroredCoupon: string) => {
            setCoupons((currentCoupons) =>
                currentCoupons.map((c) =>
                    c.code === erroredCoupon ? { ...c, isInvalid: true } : c,
                ),
            );
        };

        if (updateNameError) {
            const couponRegex = /^Coupon '([^']*)' validation failed/;
            const couponMatch = updateNameError.message.match(couponRegex)?.[1];

            if (couponMatch) {
                handleErroredCoupon(couponMatch);
            }
        }
    }, [updateNameError]);

    function closeDialog() {
        setOpen(false);
    }

    async function handleAddCoupon(coupon: string) {
        if (couponCodes.includes(coupon)) {
            setCoupons((currentCoupons) =>
                currentCoupons.filter((existingCoupon) => existingCoupon.code !== coupon),
            );
            return;
        }

        try {
            const resolvedCoupon = await iotaNamesClient.resolveCoupon(coupon);
            if (!resolvedCoupon) {
                throw new Error();
            }
            setCoupons((currentCoupons) => [...currentCoupons, { code: coupon }]);
        } catch {
            toast.error('Invalid coupon');
        }
    }

    function handleYearsChange(years: string) {
        setPurchaseYears(Number(years));
    }

    if (!isConnected) return null;

    const usingPrice = applyDiscount ? discountedPrice : price;
    const finalPrice = new BigNumber(usingPrice ?? 0)
        .plus(updateNameData?.gasSummary?.totalGas ?? 0)
        .toNumber();

    const finalPriceIota = formatNanosToIota(finalPrice, {
        formatRounded: false,
    });
    const fiatPriceResult = useCalculatePriceInFiat(finalPrice);

    const canPay =
        isConnected &&
        !nameRecordError &&
        Number(coinBalance?.totalBalance) > finalPrice &&
        nameRecordData?.type === 'available';

    const hasErrors = updateNameError || coinBalanceError;

    const isLoadingData =
        isNameRecordLoading ||
        isDiscountedPriceLoading ||
        isUpdateNameLoading ||
        isLoadingConfig ||
        isLoadingRegisterWithYears;
    const isLoading = isLoadingData || isSigning;

    const canRegister = canPay && !hasErrors && !isLoading && !isSendingTransaction;
    const expirationDate = getTargetExpirationDate(purchaseYears);

    const purchaseableYears = config && config.coreConfig ? config.coreConfig.max_years : 0;
    const purchaseYearsArray = Array.from({ length: purchaseableYears }, (_, i) => i + 1);

    const purchasePricesQueries = useQueries({
        queries: purchaseYearsArray.map((year) => ({
            queryKey: [...queryKey.renewalPrice(name, year)],
            queryFn: async () => {
                return await iotaNamesClient.calculatePrice({
                    name,
                    years: year,
                    isRegistration: false,
                });
            },
            enabled: !!iotaNamesClient && !!name && purchaseableYears > 0,
        })),
    });

    const purchaseOptions: SelectOption[] = purchaseYearsArray.map((year, idx) => {
        const labelYears = `${year} Year${year > 1 ? 's' : ''}`;
        const priceNanos = purchasePricesQueries[idx]?.data;
        const priceIota = priceNanos ? formatNanosToIota(priceNanos) : null;
        return {
            id: String(year),
            renderLabel: () => (
                <div className="flex w-full items-center justify-between">
                    <span className="text-body-lg">{labelYears}</span>
                    {priceIota && (
                        <span className="rounded-md bg-names-neutral-20 px-sm py-xs text-label-md text-names-neutral-100">
                            {priceIota}
                        </span>
                    )}
                </div>
            ),
        };
    });
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header title="Register name" onClose={closeDialog} />
                <DialogBody>
                    <div className="flex flex-col justify-between h-full items-center">
                        <div className="flex flex-col w-full gap-y-md">
                            <Panel bgColor="bg-names-neutral-12">
                                <div className="px-md py-lg">
                                    <span
                                        className="text-names-neutral-100 text-headline-sm break-words overflow-hidden"
                                        data-testid="name-purchase-title"
                                    >
                                        {normalizeIotaName(name)}
                                    </span>
                                </div>
                            </Panel>
                            {isRegisterWithYearsSupported ? (
                                <div className="relative">
                                    <Select
                                        options={purchaseOptions}
                                        value={purchaseYears?.toString()}
                                        onValueChange={handleYearsChange}
                                    />
                                </div>
                            ) : null}
                            <div className="flex flex-col">
                                <div className="self-end">
                                    <Toggle
                                        isToggled={applyCoupons}
                                        onChange={setApplyCoupons}
                                        label="Add Coupons"
                                    />
                                </div>
                                {applyCoupons && (
                                    <CouponInputSelection
                                        coupons={coupons}
                                        onAddCoupon={handleAddCoupon}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col w-full gap-y-md">
                            {updateNameError ? (
                                <InfoBox
                                    type={InfoBoxType.Error}
                                    style={InfoBoxStyle.Elevated}
                                    icon={<Warning />}
                                    title="Error"
                                    supportingText={getUserFriendlyErrorMessage(updateNameError)}
                                />
                            ) : null}
                            <Panel bgColor="bg-names-neutral-10">
                                <div className="flex flex-row gap-x-sm w-full p-md">
                                    <Checkbox
                                        name="set_display_name"
                                        isChecked={isDisplayName}
                                        onCheckedChange={(e) => setIsDisplayName(e.target.checked)}
                                        label="Set name as Display Name"
                                    />
                                </div>
                            </Panel>
                            <div className="flex flex-row gap-x-sm w-full">
                                {finalPriceIota && fiatPriceResult ? (
                                    <>
                                        <DisplayStats
                                            label="Registration Expires"
                                            value={
                                                <LabelText text={expirationDate} label={`\u00A0`} /> // \u00A0 for alignment
                                            }
                                        />
                                        <DisplayStats
                                            label="Total Due"
                                            value={
                                                <LabelText
                                                    text={finalPriceIota}
                                                    label={`($${fiatPriceResult} USD)`}
                                                />
                                            }
                                        />
                                    </>
                                ) : finalPriceIota && !fiatPriceResult ? (
                                    <>
                                        <DisplayStats
                                            label="Registration Expires"
                                            value={expirationDate}
                                        />
                                        <DisplayStats label="Total Due" value={finalPriceIota} />
                                    </>
                                ) : (
                                    <LoadingIndicator />
                                )}
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
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
