// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonType,
    Card,
    CardBody,
    CardType,
    Checkbox,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubname, MIN_LABEL_SIZE, NameRecord } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useState } from 'react';

import { NameRecordData, queryKey, useNameRecord, useRegistrationNfts } from '@/hooks';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { RegistrationNft } from '@/lib/interfaces';
import { getNameObject, isNameRecordExpired } from '@/lib/utils/names';

function createSubnameUpdates({
    name,
    nameRecord,
    ownedSubnames,
    newSubname,
    allowChildCreation,
    allowTimeExtension,
}: {
    name: string;
    nameRecord?: NameRecord;
    ownedSubnames?: RegistrationNft[];
    newSubname: string | null;
    allowChildCreation: boolean;
    allowTimeExtension: boolean;
}) {
    const isNameSubname = isSubname(nameRecord?.name || '');

    // Only join names if there user has written anything
    const fullSubnameName = newSubname?.trim() ? newSubname + '.' + name : null;
    // See if there is an existing subname with the same name
    const isSubnameAvailable = fullSubnameName
        ? getNameObject(ownedSubnames ?? [], fullSubnameName) === null
        : false;

    const updates: NameUpdate[] = [];

    const nftId = isNameSubname
        ? getNameObject(ownedSubnames ?? [], name) // We only need to search in the owned subnames if its a subname
        : nameRecord?.nftId;

    if (nftId && fullSubnameName && isSubnameAvailable) {
        updates.push({
            type: 'new-subname',
            subname: fullSubnameName,
            parentNftId: nftId,
            expirationTimeParent: nameRecord?.expirationTimestampMs || 0,
            allowChildCreation,
            allowTimeExtension,
        });
    }

    return {
        updates,
        fullSubnameName,
        isSubnameAvailable,
    };
}

type CreateSubnameProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function CreateSubnameDialog({ name, open, setOpen }: CreateSubnameProps) {
    const queryClient = useQueryClient();
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();
    const { data: ownedSubnames } = useRegistrationNfts('subname');
    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord?.nameRecord) : false;

    // Editable values
    const [editSubname, setEditSubname] = useState('');
    const [editIsAllowingRenew, setEditIsAllowingRenew] = useState<boolean>(false);
    const [editIsAllowSubnames, setEditIsAllowSubnames] = useState<boolean>(false);

    const { updates, fullSubnameName, isSubnameAvailable } = createSubnameUpdates({
        name,
        nameRecord: nameRecord?.nameRecord,
        newSubname: editSubname,
        ownedSubnames,
        allowTimeExtension: editIsAllowingRenew,
        allowChildCreation: editIsAllowSubnames,
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

    const { mutate: save, isPending: isSaving } = useMutation({
        async mutationFn() {
            if (!updateNameTransaction) return;
            const transaction = await signAndExecuteTransaction({
                transaction: updateNameTransaction,
            });

            await iotaClient.waitForTransaction({
                digest: transaction.digest,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKey.ownedObjects(account?.address || ''),
            });
            closeDialog();
        },
    });

    function closeDialog() {
        setOpen(false);
    }
    const handleCancelAddSubname = () => {
        setEditSubname('');
        closeDialog();
    };

    const handleAllowRenewChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        setEditIsAllowingRenew(checked);
    };

    const handleAllowSubnameChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        setEditIsAllowSubnames(checked);
    };

    const isLoading = isSaving || isLoadingUpdateNameTransaction || isSendingTransaction;

    const disableEdit = isNameRecordLoading || isSendingTransaction || isExpired;
    const disableSave =
        updates.length === 0 ||
        isLoading ||
        isExpired ||
        !editSubname.trim() ||
        editSubname.length < MIN_LABEL_SIZE;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" isFixedPosition>
                <Header title="Add subname" titleCentered />
                <DialogBody>
                    <div className="flex flex-col items-center gap-y-md">
                        <h3 className="text-lg font-semibold mb-4">Add subname to {name}</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Subname:</label>
                            <Input
                                type={InputType.Text}
                                value={editSubname}
                                onChange={(e) => setEditSubname(e.target.value)}
                                placeholder="Input subname"
                            />
                            <Card type={CardType.Outlined}>
                                <CardBody
                                    title="Set allow renew name"
                                    subtitle="Allow renew name."
                                />
                                <Checkbox
                                    isChecked={editIsAllowingRenew}
                                    isDisabled={disableEdit}
                                    onCheckedChange={handleAllowRenewChange}
                                />
                            </Card>
                            <Card type={CardType.Outlined}>
                                <CardBody
                                    title="Set allow subname"
                                    subtitle="Allow creating subnames."
                                />
                                <Checkbox
                                    isChecked={editIsAllowSubnames}
                                    isDisabled={disableEdit}
                                    onCheckedChange={handleAllowSubnameChange}
                                />
                            </Card>
                            {editSubname && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Preview: {fullSubnameName}
                                </p>
                            )}
                        </div>
                        {!isSubnameAvailable && fullSubnameName ? (
                            <div className="text-red-500 mb-4">This subname is not available</div>
                        ) : null}
                        {updateNameError ? (
                            <div className="text-red-400">{updateNameError.message}</div>
                        ) : null}
                        <div className="flex gap-2 justify-end">
                            <Button
                                type={ButtonType.Secondary}
                                text="Cancel"
                                onClick={handleCancelAddSubname}
                            />
                            <Button
                                icon={isLoading ? <LoadingIndicator /> : null}
                                text="Create"
                                disabled={disableSave}
                                onClick={() => save()}
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
