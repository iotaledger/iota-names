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
import { isSubname, MIN_LABEL_SIZE } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useState } from 'react';

import { NameRecordData, queryKey, useNameRecord, useRegistrationNfts } from '@/hooks';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { getSubnameObjectId, isNameRecordExpired } from '@/lib/utils/names';

type CreateSubnameProps = {
    parent: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function CreateSubnameDialog({ parent, open, setOpen }: CreateSubnameProps) {
    const queryClient = useQueryClient();
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();

    const subnamesOwned = useRegistrationNfts('subname').data || [];
    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(parent);

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord?.nameRecord) : false;
    const isNameSubname = parent ? isSubname(parent) : null;

    // Create updates
    const updates: NameUpdate[] = [];

    // Editable values
    const [newSubname, setNewSubname] = useState('');
    const [editIsAllowingRenew, setEditIsAllowingRenew] = useState<boolean>(false);
    const [editIsAllowSubnames, setEditIsAllowSubnames] = useState<boolean>(false);
    const fullSubname = newSubname.trim() ? newSubname + '.' + parent : '';
    const isAvailable = getSubnameObjectId(subnamesOwned, fullSubname) === null;

    if (parent && newSubname && fullSubname && isAvailable) {
        const parentNftId = isNameSubname
            ? getSubnameObjectId(subnamesOwned, parent)
            : nameRecord?.nameRecord.nftId;

        if (parentNftId) {
            updates.push({
                type: 'new-subname',
                subname: fullSubname,
                parentNftId: parentNftId ?? '',
                expirationTimeParent: nameRecord?.nameRecord?.expirationTimestampMs || 0,
                allowChildCreation: editIsAllowSubnames,
                allowTimeExtension: editIsAllowingRenew,
            });
        }
    }
    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingUpdateNameTransaction,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        name: parent,
        updates,
        isExpired,
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
        setNewSubname('');
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
        !newSubname.trim() ||
        newSubname.length < MIN_LABEL_SIZE;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title="Add subname" titleCentered />
                <DialogBody>
                    <div className="flex flex-col items-center gap-y-md">
                        <h3 className="text-lg font-semibold mb-4">Add subname to {parent}</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Subname:</label>
                            <Input
                                type={InputType.Text}
                                value={newSubname}
                                onChange={(e) => setNewSubname(e.target.value)}
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
                            {newSubname && (
                                <p className="text-sm text-gray-600 mt-1">Preview: {fullSubname}</p>
                            )}
                        </div>
                        {!isAvailable ? (
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
