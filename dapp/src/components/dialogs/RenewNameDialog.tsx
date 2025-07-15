// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    Button,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubname, NameRecord } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
    NameRecordData,
    queryKey,
    useNameRecord,
    useRegistrationNfts,
    useRenewData,
} from '@/hooks';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { CANNOT_EXCEED_MAX_YEARS, CANT_RENEW_NAME_FOR_MORE_TIME } from '@/lib/constants';
import { RegistrationNft } from '@/lib/interfaces';
import {
    getNameObject,
    getNamePermissions,
    getParentObject,
    isGracePeriodExpired,
} from '@/lib/utils/names';

function createRenewUpdates({
    nameRecord,
    ownedNames = [],
    ownedSubnames = [],
    renewYears,
}: {
    nameRecord?: NameRecord;
    ownedNames?: RegistrationNft[];
    ownedSubnames?: RegistrationNft[];
    renewYears?: number;
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
            nftId: nameRecord.nftId,
            years: renewYears,
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
    open: boolean;
    setOpen: (bool: boolean) => void;
}

export function RenewNameDialog({ open, setOpen, name }: RenewDialogProps) {
    const queryClient = useQueryClient();
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();
    const { data: nameRecordData } = useNameRecord(name);
    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : null;
    // Editable values
    const [editRenewYears, setEditRenewYears] = useState<number>();
    const [renewError, setRenewError] = useState<string | null>(null);
    const { data: ownedNames } = useRegistrationNfts('name');
    const { data: ownedSubnames } = useRegistrationNfts('subname');
    const { data: renewData } = useRenewData(
        nameRecord?.nameRecord.expirationTimestampMs ?? 0,
        editRenewYears ?? 1,
    );

    const maxYearsToRenew = renewData?.yearsToRenew;

    const updates = createRenewUpdates({
        nameRecord: nameRecord?.nameRecord,
        ownedNames,
        ownedSubnames,
        renewYears: editRenewYears,
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
                transaction: updateNameTransaction,
            });

            await iotaClient.waitForTransaction({
                digest: transactionResult.digest,
            });
        },
        onSuccess() {
            setOpen(false);
            queryClient.invalidateQueries({
                queryKey: queryKey.nameRecord(name),
            });
        },
    });

    const handleCancelRenewName = () => {
        setOpen(false);
    };

    const wantsToRenew = isNameSubname || !!editRenewYears;
    const canRenew = nameRecord && updates.length > 0;
    const isLoading = isLoadingUpdateNameTransaction || isSendingTransaction || isSigning;
    const disableEdit = isSendingTransaction || isSigning;
    const disableSave =
        isLoading || !canRenew || !wantsToRenew || !!updateNameError || !!renewError;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" isFixedPosition>
                <Header title="Renew" titleCentered />
                <DialogBody>
                    <div className="flex flex-col items-center gap-y-md">
                        <h3 className="text-lg font-semibold mb-4">
                            Renew name {nameRecord?.nameRecord?.name}
                        </h3>
                        {!isNameSubname ? (
                            <div className="mb-4">
                                <Input
                                    type={InputType.Number}
                                    onChange={async (e) => {
                                        const val = Number(e.target.value);
                                        setRenewError(null);
                                        if (maxYearsToRenew && val > maxYearsToRenew) {
                                            setRenewError(
                                                `You cannot renew for more than ${maxYearsToRenew} years.`,
                                            );
                                        } else if (val < 0) {
                                            setRenewError('Input a positive number.');
                                        } else {
                                            setEditRenewYears(isNaN(val) ? 0 : val);
                                        }
                                    }}
                                    placeholder="Input renew years"
                                    disabled={disableEdit}
                                />
                            </div>
                        ) : null}
                        <div className="mb-4">
                            You can renew this name for a maximum of {maxYearsToRenew} years
                        </div>
                        {!canRenew && wantsToRenew ? (
                            <div className="text-yellow-400">{CANT_RENEW_NAME_FOR_MORE_TIME}</div>
                        ) : null}
                        {renewError ? (
                            <div className="text-red-400">{CANNOT_EXCEED_MAX_YEARS}</div>
                        ) : wantsToRenew && !renewData?.isRenewable ? (
                            <div className="text-red-400">{CANNOT_EXCEED_MAX_YEARS}</div>
                        ) : updateNameError ? (
                            <div className="text-red-400">{updateNameError.message}</div>
                        ) : null}
                        <div className="flex gap-2 justify-end">
                            <Button
                                type={ButtonType.Secondary}
                                text="Cancel"
                                onClick={handleCancelRenewName}
                            />
                            <Button
                                icon={isLoading ? <LoadingIndicator /> : null}
                                type={ButtonType.Primary}
                                text="Confirm"
                                onClick={() => handleConfirmRenewName()}
                                disabled={disableSave}
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
