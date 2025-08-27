// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Warning } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonType,
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
import { isSubname, NameRecord, normalizeIotaName } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useIotaNamesClient } from '@/contexts';
import { NameRecordData, queryKey, useNameRecord, useRegistrationNfts } from '@/hooks';
import { useCoreConfig } from '@/hooks/useCoreConfig';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { GAS_BALANCE_TOO_LOW_ID } from '@/lib/constants';
import { RegistrationNft } from '@/lib/interfaces';
import { getUserFriendlyErrorMessage } from '@/lib/utils';
import { formatExpirationDate } from '@/lib/utils/format/formatExpirationDate';
import {
    getNameObject,
    getNamePermissions,
    getNameRenewableYears,
    getParentObject,
    isGracePeriodExpired,
} from '@/lib/utils/names';

import { CouponInputSelection } from '../CouponInputSelection';
import type { UserSetCoupon } from './PurchaseNameDialog';

function createRenewUpdates({
    nameRecord,
    ownedNames = [],
    ownedSubnames = [],
    renewYears,
    applyCoupons = false,
    coupons = [],
    address,
}: {
    nameRecord?: NameRecord;
    ownedNames?: RegistrationNft[];
    ownedSubnames?: RegistrationNft[];
    renewYears?: number;
    applyCoupons?: boolean;
    coupons?: string[];
    address?: string;
}) {
    const isNameSubname = nameRecord?.name ? isSubname(nameRecord.name) : false;
    const namePermissions = nameRecord ? getNamePermissions(nameRecord) : null;
    const isExpired = nameRecord ? isGracePeriodExpired(nameRecord) : false;

    const updates: NameUpdate[] = [];

    // Renew names
    if (
        !isNameSubname &&
        nameRecord &&
        namePermissions?.allowTimeExtension &&
        renewYears &&
        !isExpired
    ) {
        updates.push({
            type: 'renew-name',
            name: nameRecord.name,
            nftId: nameRecord.nftId,
            years: renewYears,
            address,
            ...(applyCoupons && coupons.length ? { couponCodes: coupons } : {}),
        });
    }

    // Renew subnames
    if (isNameSubname && nameRecord && namePermissions?.allowTimeExtension && !isExpired) {
        const objectId = getNameObject(ownedSubnames, nameRecord.name);
        const parentObject = getParentObject(ownedNames, ownedSubnames, nameRecord.name);
        if (objectId && parentObject) {
            // Only allow extending the expiration time if its less than its parent
            const expiresBeforeParent =
                nameRecord.expirationTimestampMs < parentObject?.expirationTimestampMs;
            if (expiresBeforeParent) {
                updates.push({
                    type: 'renew-subname',
                    nftId: objectId,
                    expirationTimestampMs: parentObject.expirationTimestampMs,
                });
            }
        }
    }
    return updates;
}

interface RenewDialogProps {
    name: string;
    setOpen: (bool: boolean) => void;
    onRenew?: () => void;
}

export function RenewNameDialog({ setOpen, name, onRenew }: RenewDialogProps) {
    const queryClient = useQueryClient();
    const iotaClient = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    const account = useCurrentAccount();
    const { data: nameRecordData, isLoading: isLoadingNameRecord } = useNameRecord(name);
    const { data: coreConfig, isLoading: isLoadingcoreConfig } = useCoreConfig();

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : null;

    const [renewYears, setRenewYears] = useState<number | undefined>();
    const [coupons, setCoupons] = useState<UserSetCoupon[]>([]);
    const [applyCoupons, setApplyCoupons] = useState(false);

    const { data: ownedNames } = useRegistrationNfts('name');
    const { data: ownedSubnames } = useRegistrationNfts('subname');

    const couponCodes = coupons.map((c) => c.code);

    const updates = createRenewUpdates({
        nameRecord: nameRecord?.nameRecord,
        ownedNames,
        ownedSubnames,
        renewYears,
        applyCoupons,
        coupons: couponCodes,
        address: account?.address,
    });

    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingUpdateNameTransaction,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        updates,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { mutateAsync: handleConfirmRenewName, isPending: isSigning } = useMutation({
        async mutationFn() {
            if (!updateNameTransaction) return;
            const transactionResult = await signAndExecuteTransaction({
                transaction: updateNameTransaction.transaction,
            });

            await iotaClient.waitForTransaction({
                digest: transactionResult.digest,
            });
        },
        onSuccess() {
            setOpen(false);
            if (onRenew) {
                onRenew();
            }
            queryClient.invalidateQueries({
                queryKey: queryKey.nameRecord(name),
            });
            queryClient.invalidateQueries({
                queryKey: queryKey.getObject(name),
            });
            toast.success('Name renewed successfully');
        },
        onError(error) {
            toast.error(getUserFriendlyErrorMessage(error));
        },
    });

    async function handleAddCoupon(couponCode: string) {
        if (couponCodes.includes(couponCode)) {
            setCoupons((currentCoupons) =>
                currentCoupons.filter((existingCoupon) => existingCoupon.code !== couponCode),
            );
            return;
        }

        try {
            const resolvedCoupon = await iotaNamesClient.resolveCoupon(couponCode);
            if (!resolvedCoupon) throw new Error();
            setCoupons((currentCoupons) => [...currentCoupons, { code: couponCode }]);
        } catch {
            toast.error('Invalid coupon');
        }
    }

    function handleCancelRenewName() {
        setOpen(false);
    }

    function handleYearsChange(years: string) {
        setRenewYears(Number(years));
    }

    const renewableYears =
        coreConfig && nameRecord
            ? getNameRenewableYears(
                  coreConfig.max_years,
                  nameRecord.nameRecord.expirationTimestampMs,
              )
            : 0;
    const isRenewable = (renewableYears ?? 0) > 0;

    const renewOptions: SelectOption[] = Array.from({ length: renewableYears }, (_, i) => ({
        id: String(i + 1),
        label: `${i + 1} Year${i ? 's' : ''}`,
    }));

    useEffect(() => {
        if (!renewYears && renewOptions.length && renewableYears >= 1) {
            setRenewYears(1);
        }
    }, [renewOptions, renewYears, renewableYears]);

    useEffect(() => {
        const handleErroredCoupon = (erroredCoupon: string) => {
            setCoupons((currentCoupons) =>
                currentCoupons.map((c) =>
                    c.code === erroredCoupon ? { ...c, isInvalid: true } : c,
                ),
            );
        };
        if (updateNameError) {
            if (updateNameError.message.includes(GAS_BALANCE_TOO_LOW_ID)) {
                toast.error(getUserFriendlyErrorMessage(GAS_BALANCE_TOO_LOW_ID));
            } else {
                const couponRegex = /^Coupon '([^']*)' validation failed/;
                const couponMatch = updateNameError.message.match(couponRegex)?.[1];

                if (couponMatch) {
                    handleErroredCoupon(couponMatch);
                }

                toast.error(updateNameError.message);
            }
        }
    }, [updateNameError]);

    const wantsToRenew = isNameSubname || !!renewYears;
    const canRenew = nameRecord && updates.length > 0;
    const expirationDate = nameRecord?.nameRecord.expirationTimestampMs
        ? formatExpirationDate(new Date(nameRecord.nameRecord.expirationTimestampMs))
        : null;

    const isLoadingData = isLoadingNameRecord || isLoadingcoreConfig;
    const isLoading =
        isLoadingUpdateNameTransaction || isSendingTransaction || isSigning || isLoadingData;

    const disableEdit = isSendingTransaction || isSigning || renewOptions.length === 0;
    const disableSave = isLoading || !canRenew || !wantsToRenew || !!updateNameError;
    const cleanName = normalizeIotaName(nameRecord?.nameRecord?.name || name);

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header title="Renew Name" onClose={() => setOpen(false)} />
                <DialogBody>
                    <div className="flex flex-col justify-between h-full items-center">
                        <div className="flex flex-col w-full gap-y-md">
                            <Panel bgColor="bg-names-neutral-12">
                                <div className="px-md py-lg">
                                    <span className="text-names-neutral-100 text-headline-sm break-words">
                                        {cleanName}
                                    </span>
                                </div>
                            </Panel>
                            {!isNameSubname && isRenewable && !isLoadingData && (
                                <Select
                                    options={renewOptions}
                                    value={renewYears?.toString()}
                                    onValueChange={handleYearsChange}
                                    disabled={disableEdit}
                                />
                            )}
                            {!isNameSubname && renewOptions.length === 0 && !isLoadingData && (
                                <InfoBox
                                    type={InfoBoxType.Warning}
                                    icon={<Warning />}
                                    title="Renewal Limit Reached"
                                    style={InfoBoxStyle.Default}
                                    supportingText={`This name has already been extended to the maximum allowed period of ${coreConfig?.max_years} years. You'll be able to renew it again once it gets closer to its expiration date`}
                                />
                            )}
                            {!isNameSubname && (
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
                            )}
                        </div>
                        <div className="flex flex-col w-full gap-y-md">
                            <div className="flex flex-row gap-x-sm w-full">
                                <DisplayStats
                                    icon={isLoading ? <LoadingIndicator /> : null}
                                    label="Registration Expires"
                                    value={expirationDate}
                                />
                            </div>
                            <div className="flex w-full flex-row gap-x-xs mt-xs">
                                <Button
                                    type={ButtonType.Secondary}
                                    text="Cancel"
                                    onClick={handleCancelRenewName}
                                    fullWidth
                                />
                                <Button
                                    icon={isLoading ? <LoadingIndicator /> : null}
                                    type={ButtonType.Primary}
                                    text="Renew"
                                    onClick={() => handleConfirmRenewName()}
                                    disabled={disableSave}
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
