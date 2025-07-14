// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    Card,
    CardBody,
    CardType,
    Checkbox,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubname } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useState } from 'react';

import { useRegistrationNfts } from '@/hooks';
import { queryKey } from '@/hooks/queryKey';
import { useGetDefaultName } from '@/hooks/useGetDefaultName';
import { NameRecordData, useNameRecord } from '@/hooks/useNameRecord';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { getNamePermissions, getParentObjectId, isNameRecordExpired } from '@/lib/utils/names';

import { RenewNameDialog } from './RenewNameDialog';

type UpdateNameDialogProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function UpdateNameDialog({ name, open, setOpen }: UpdateNameDialogProps) {
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const account = useCurrentAccount();
    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);
    const { data: addressName, isLoading: isAddressNameLoading } = useGetDefaultName(
        account?.address || '',
    );

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;
    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : null;
    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord?.nameRecord) : false;
    const namePermissions = nameRecord?.nameRecord
        ? getNamePermissions(nameRecord.nameRecord)
        : null;

    const { data: namesOwned } = useRegistrationNfts('name');
    const { data: subnamesOwned } = useRegistrationNfts('subname');

    // Editable values
    const [editIsDefaultName, setEditDefaultName] = useState<boolean>(false);
    const [editIsAllowingRenew, setEditIsAllowingRenew] = useState<boolean>(false);
    const [editIsAllowSubnames, setEditIsAllowSubnames] = useState<boolean>(false);

    // Dialogs
    const [renewDialogOpen, setRenewDialogOpen] = useState(false);

    // Sync permissions
    useEffect(() => {
        if (namePermissions) {
            setEditIsAllowingRenew(namePermissions.allowTimeExtension);
            setEditIsAllowSubnames(namePermissions.allowChildCreation);
        }
    }, [namePermissions?.allowChildCreation, namePermissions?.allowTimeExtension]);

    // Sync address current default name
    useEffect(() => {
        if (addressName === name) {
            setEditDefaultName(true);
        }
    }, [addressName]);

    const isDefaultName = addressName === name;

    // Create updates
    const updates: NameUpdate[] = [];

    if (isDefaultName && !editIsDefaultName) {
        // If it is currently the default name, but it is now disabled
        updates.push({
            type: 'unset-default',
        });
    } else if (!isDefaultName && editIsDefaultName) {
        // If it is not currently the default name, but it is now enabled and the target address matches
        updates.push({
            type: 'set-default',
            name,
        });
    }

    if (
        nameRecord &&
        isNameSubname &&
        (editIsAllowSubnames != namePermissions?.allowChildCreation ||
            editIsAllowingRenew != namePermissions?.allowTimeExtension)
    ) {
        // To edit the setup of a subname we need to get its parent
        // Its parent can be another name or another subname
        const parentObjectId = getParentObjectId(namesOwned ?? [], subnamesOwned ?? [], name);
        if (parentObjectId) {
            updates.push({
                type: 'edit-setup',
                name,
                parentNftId: parentObjectId,
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

            for (const update of updates) {
                switch (update.type) {
                    case 'unset-default':
                    case 'set-default':
                        queryClient.invalidateQueries({
                            queryKey: queryKey.defaultName(account?.address || ''),
                        });
                        break;
                    case 'edit-setup':
                }
            }
        },
    });

    function handleClose() {
        setOpen(false);
    }

    function handleReverseLookupChange({ target: { checked } }: ChangeEvent<HTMLInputElement>) {
        setEditDefaultName(checked);
    }
    const handleAllowRenewChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        setEditIsAllowingRenew(checked);
    };

    const handleAllowSubnameChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        setEditIsAllowSubnames(checked);
    };

    const isLoading =
        isSaving || isAddressNameLoading || isLoadingUpdateNameTransaction || isSendingTransaction;

    const disableEdit = isNameRecordLoading || isSendingTransaction || isExpired;
    const disableSave = updates.length === 0 || isLoading || isExpired;
    const disableRenew = isExpired;

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent containerId="overlay-portal-container" isFixedPosition>
                    <Header title={`Update ${name}`} onClose={handleClose} titleCentered />
                    <DialogBody>
                        {isExpired && !isLoading ? (
                            <Card>
                                <p className="text-yellow-300">Name is expired.</p>
                            </Card>
                        ) : null}
                        <Card type={CardType.Outlined}>
                            <CardBody
                                title="Set as default name"
                                subtitle="Enables reverse lookup."
                            />
                            <Checkbox
                                isChecked={editIsDefaultName}
                                isDisabled={disableEdit}
                                onCheckedChange={handleReverseLookupChange}
                            />
                        </Card>
                        {isNameSubname ? (
                            <>
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
                            </>
                        ) : null}
                        {namePermissions?.allowTimeExtension && (
                            <Card type={CardType.Outlined}>
                                <CardBody
                                    title="Renew"
                                    subtitle={`Renew ${isNameSubname ? 'Subname' : 'Name'}.`}
                                />
                                <Button
                                    text="Renew"
                                    onClick={() => setRenewDialogOpen(true)}
                                    disabled={disableRenew} //TODO: add grace period
                                />
                            </Card>
                        )}
                        {updateNameError ? (
                            <div className="text-red-400">{updateNameError.message}</div>
                        ) : null}
                        <Button
                            icon={isLoading ? <LoadingIndicator /> : null}
                            text="Save"
                            disabled={disableSave}
                            onClick={() => save()}
                        />
                    </DialogBody>
                </DialogContent>
            </Dialog>
            {renewDialogOpen && (
                <RenewNameDialog open={renewDialogOpen} setOpen={setRenewDialogOpen} name={name} />
            )}
        </>
    );
}
