// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

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
    Select,
    SelectOption,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubname, NameRecord } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { NameRecordData, queryKey, useNameRecord, useRegistrationNfts } from '@/hooks';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { RegistrationNft } from '@/lib/interfaces';
import { formatExpirationDate } from '@/lib/utils/format/formatExpirationDate';
import { normalizeNameInput } from '@/lib/utils/format/formatNames';
import { getDefaultExpirationDate } from '@/lib/utils/getDefaultExpirationDate';
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

    const [selectedYears, setSelectedYears] = useState<string>('');
    const renewYears = selectedYears ? Number(selectedYears) : undefined;

    const { data: ownedNames } = useRegistrationNfts('name');
    const { data: ownedSubnames } = useRegistrationNfts('subname');

    const updates = createRenewUpdates({
        nameRecord: nameRecord?.nameRecord,
        ownedNames,
        ownedSubnames,
        renewYears,
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

    function handleCancelRenewName() {
        setOpen(false);
    }

    function handleYearsChange(id: string) {
        setSelectedYears(id);
    }

    const RENEW_OPTIONS: SelectOption[] = [
        { id: '', label: 'Select renewal period' },
        ...Array.from({ length: 5 }, (_, i) => ({
            id: String(i + 1),
            label: `${i + 1} Year${i ? 's' : ''}`,
        })),
    ];

    const wantsToRenew = isNameSubname || !!renewYears;
    const canRenew = nameRecord && updates.length > 0;
    const isLoading = isLoadingUpdateNameTransaction || isSendingTransaction || isSigning;
    const disableEdit = isSendingTransaction || isSigning;
    const disableSave = isLoading || !canRenew || !wantsToRenew || !!updateNameError;
    const cleanName = normalizeNameInput(nameRecord?.nameRecord?.name || name);
    const expirationDate = nameRecord?.nameRecord?.expirationTimestampMs
        ? formatExpirationDate(new Date(nameRecord.nameRecord.expirationTimestampMs))
        : getDefaultExpirationDate();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header title="Renew Name" />
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
                            {!isNameSubname && (
                                <Select
                                    options={RENEW_OPTIONS}
                                    placeholder="Select renewal period"
                                    value={selectedYears}
                                    onValueChange={handleYearsChange}
                                    disabled={disableEdit}
                                    errorMessage={updateNameError?.message}
                                />
                            )}
                        </div>
                        <div className="flex flex-col w-full gap-y-md">
                            <div className="flex flex-row gap-x-sm w-full">
                                <DisplayStats label="Registration Expires" value={expirationDate} />
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
