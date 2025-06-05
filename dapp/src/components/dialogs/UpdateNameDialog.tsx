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
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import {
    useCurrentAccount,
    useIotaClient,
    useIotaClientQuery,
    useSignAndExecuteTransaction,
} from '@iota/dapp-kit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useState } from 'react';

import { NameRecordData, useNameRecord } from '@/hooks/useNameRecord';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';

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
    const { data: addressName, isLoading: isAddressNameLoading } = useIotaClientQuery(
        'iotaNamesReverseLookup',
        {
            address: account?.address || '',
        },
        {
            queryKey: ['iota-name', name],
        },
    );

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    // Editable values
    const [editTargetAddress, setEditTargetAddress] = useState<string>('');
    const [editIsDefaultName, setEditDefaultName] = useState<boolean>(false);

    // Setting a different target address than the owner can give issues, specially when setting the name as a default name for a different address
    const targetAddressDiffer =
        editTargetAddress.length > 0 && account ? editTargetAddress !== account?.address : null;

    // Sync name target address
    useEffect(() => {
        if (nameRecord && editTargetAddress.length === 0) {
            setEditTargetAddress(nameRecord.nameRecord.targetAddress);
        }
    }, [nameRecord]);

    // Sync address current default name
    useEffect(() => {
        if (addressName === name) {
            setEditDefaultName(true);
        }
    }, [addressName]);

    // Create updates
    const updates: NameUpdate[] = [];

    if (editTargetAddress !== nameRecord?.nameRecord.targetAddress) {
        updates.push({
            type: 'set-target-address',
            address: editTargetAddress,
            isSubname: false,
        });
    }

    if (addressName === name && !editIsDefaultName) {
        updates.push({
            type: 'unset-default',
        });
    } else if (addressName !== name && editIsDefaultName && !targetAddressDiffer) {
        updates.push({
            type: 'set-default',
            name,
        });
    }

    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingUpdateNameTransaction,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        name,
        nft: nameRecord?.nameRecord?.nftId || '',
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

            await queryClient.refetchQueries({
                predicate: (query) => query.queryKey.includes('iota-name'),
            });
        },
    });

    function handleClose() {
        setOpen(false);
    }

    function handleTargetAddressChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
        setEditTargetAddress(value);
    }

    function handleReverseLookupChange({ target: { checked } }: ChangeEvent<HTMLInputElement>) {
        setEditDefaultName(checked);
    }

    function handleSetCurrentAsTargetAddress() {
        if (account?.address) {
            setEditTargetAddress(account?.address);
        }
    }

    const isLoading = isSaving || isLoadingUpdateNameTransaction;

    const disableTargetAddressEdit = isNameRecordLoading || isSendingTransaction;
    const disableNameCheckboxEdit =
        targetAddressDiffer || isAddressNameLoading || isSendingTransaction;
    const disableSaveButton = updates.length === 0 || isSendingTransaction || isLoading;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title={`Update ${name}`} onClose={handleClose} titleCentered />
                <DialogBody>
                    {targetAddressDiffer ? (
                        <Card>
                            <p className="text-yellow-300">
                                {' '}
                                Use your account as target address to be able to set this name as
                                default.
                            </p>
                        </Card>
                    ) : null}
                    <Card type={CardType.Outlined}>
                        <CardBody title="Target Address" />
                        <Input
                            type={InputType.Text}
                            value={editTargetAddress}
                            disabled={disableTargetAddressEdit}
                            onChange={handleTargetAddressChange}
                        />
                        {targetAddressDiffer && (
                            <Button onClick={handleSetCurrentAsTargetAddress} text="Use current" />
                        )}
                    </Card>
                    <Card type={CardType.Outlined}>
                        <CardBody title="Set as default name" subtitle="Enables reverse lookup." />
                        <Checkbox
                            isChecked={editIsDefaultName}
                            isDisabled={disableNameCheckboxEdit}
                            onCheckedChange={handleReverseLookupChange}
                        />
                    </Card>
                    {updateNameError ? (
                        <div className="text-red-400">{updateNameError.message}</div>
                    ) : null}
                    <Button
                        icon={isLoading ? <LoadingIndicator /> : null}
                        text="Save"
                        disabled={disableSaveButton}
                        onClick={() => save()}
                    />
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
