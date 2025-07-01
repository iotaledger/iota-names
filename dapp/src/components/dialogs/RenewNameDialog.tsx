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
import { isSubName } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { NameRecordData, queryKey, useNameRecord, useRegistrationNfts } from '@/hooks';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import {
    getNamePermissions,
    getParentObject,
    getSubdomainObjectId,
    isNameRecordExpired,
} from '@/lib/utils/names';

interface AvatarSelectDialogProps {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
}
export function RenewNameDialog({ open, setOpen, name }: AvatarSelectDialogProps) {
    const queryClient = useQueryClient();
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();
    const { data: nameRecordData } = useNameRecord(name);

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isNameSubName = nameRecord?.nameRecord ? isSubName(nameRecord.nameRecord.name) : null;
    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord?.nameRecord) : false;
    const namePermissions = nameRecord?.nameRecord
        ? getNamePermissions(nameRecord.nameRecord)
        : null;

    // Editable values
    const [editRenewYears, setEditRenewYears] = useState<number>();

    const { data: domainsOwned } = useRegistrationNfts('domain');
    const { data: subdomainsOwned } = useRegistrationNfts('subdomain');

    const updates: NameUpdate[] = [];

    let canBeRenewed = true;

    if (nameRecord && editRenewYears && !isExpired && namePermissions?.allowTimeExtension) {
        const objectId = getSubdomainObjectId(
            domainsOwned ?? [],
            subdomainsOwned ?? [],
            nameRecord.nameRecord.name,
        );
        if (objectId) {
            updates.push({
                type: 'renew-name',
                nftId: objectId,
                years: editRenewYears,
            });
        } else {
            canBeRenewed = false;
        }
    }
    if (isNameSubName && nameRecord && !isExpired && namePermissions?.allowTimeExtension) {
        const objectId = getSubdomainObjectId(
            domainsOwned ?? [],
            subdomainsOwned ?? [],
            nameRecord.nameRecord.name,
        );
        const parentName = getParentObject(
            domainsOwned ?? [],
            subdomainsOwned ?? [],
            nameRecord.nameRecord.name,
        );
        // Only allow extending the expiration time if its less than its parent
        if (
            objectId &&
            parentName?.expiration_timestamp_ms &&
            nameRecord.nameRecord.expirationTimestampMs < parentName?.expiration_timestamp_ms
        ) {
            updates.push({
                type: 'renew-subname',
                nftId: objectId,
                expirationTimestampMs: parentName.expiration_timestamp_ms,
            });
        } else {
            canBeRenewed = false;
        }
    }

    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingUpdateNameTransaction,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        name,
        updates,
        isExpired,
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

    const isLoading = isLoadingUpdateNameTransaction || isSendingTransaction || isSigning;
    const disableEdit = isLoading;
    const disableSave = isLoading || updates.length === 0 || !!updateNameError;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title="Renew" titleCentered />
                <DialogBody>
                    <div className="flex flex-col items-center gap-y-md">
                        <h3 className="text-lg font-semibold mb-4">
                            Renew name {nameRecord?.nameRecord?.name}
                        </h3>
                        {!isNameSubName ? (
                            <div className="mb-4">
                                <Input
                                    type={InputType.Text}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setEditRenewYears(isNaN(val) ? 0 : val);
                                    }}
                                    placeholder="Input renew years"
                                    disabled={disableEdit}
                                />
                            </div>
                        ) : null}
                        {!canBeRenewed ? (
                            <div className="text-yellow-400">
                                Can't renew this domain for more time.
                            </div>
                        ) : null}
                        {updateNameError ? (
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
