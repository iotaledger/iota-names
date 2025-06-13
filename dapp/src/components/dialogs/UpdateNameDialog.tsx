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
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isValidIotaAddress } from '@iota/iota-sdk/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useState } from 'react';

import { queryKey } from '@/hooks/queryKey';
import { useGetDefaultName } from '@/hooks/useGetDefaultName';
import { NameRecordData, useNameRecord } from '@/hooks/useNameRecord';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { isNameRecordExpired } from '@/lib/utils/names';

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

    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord?.nameRecord) : false;

    // Editable values
    const [editTargetAddress, setEditTargetAddress] = useState<string>('');
    const [editIsDefaultName, setEditDefaultName] = useState<boolean>(false);

    // Sync name target address
    useEffect(() => {
        if (nameRecord && editTargetAddress.length === 0) {
            setEditTargetAddress(nameRecord.nameRecord.targetAddress ?? '');
        }
    }, [nameRecord]);

    // Sync address current default name
    useEffect(() => {
        if (addressName === name) {
            setEditDefaultName(true);
        }
    }, [addressName]);

    const isTargetCurrentAddress = editTargetAddress === account?.address;
    const isTargetUsedInName = editTargetAddress === nameRecord?.nameRecord.targetAddress;
    const isDefaultName = addressName === name;

    // Setting a different target address than the owner address and using the name as default is not possible
    const isWrongCombination = !isTargetCurrentAddress && editIsDefaultName;
    const isValidAddress = isValidIotaAddress(editTargetAddress);
    const isThereAddress = editTargetAddress.length > 0;

    // Create updates
    const updates: NameUpdate[] = [];

    if (isThereAddress && isValidAddress && !isTargetUsedInName) {
        // Only allow changing the target address if it is valid and it is not used yet
        updates.push({
            type: 'set-target-address',
            address: editTargetAddress,
            isSubname: false,
        });
    }

    if (isDefaultName && !editIsDefaultName) {
        // If it is currently the default name, but it is now disabled
        updates.push({
            type: 'unset-default',
        });
    } else if (!isDefaultName && editIsDefaultName && isTargetCurrentAddress) {
        // If it is not currently the default name, but it is now enabled and the target address matches
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

            for (const update of updates) {
                switch (update.type) {
                    case 'unset-default':
                    case 'set-default':
                        queryClient.invalidateQueries({
                            queryKey: queryKey.defaultName(account?.address || ''),
                        });
                        break;
                    case 'set-target-address':
                        queryClient.invalidateQueries({
                            queryKey: queryKey.nameRecord(name),
                        });
                        break;
                }
            }
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

    const isLoading =
        isSaving || isAddressNameLoading || isLoadingUpdateNameTransaction || isSendingTransaction;

    const disableEdit = isNameRecordLoading || isSendingTransaction || isExpired;
    const disableSave = updates.length === 0 || isWrongCombination || isLoading || isExpired;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title={`Update ${name}`} onClose={handleClose} titleCentered />
                <DialogBody>
                    {isExpired && !isLoading ? (
                        <Card>
                            <p className="text-yellow-300">Name is expired.</p>
                        </Card>
                    ) : null}
                    {isThereAddress && !isValidAddress ? (
                        <Card>
                            <p className="text-yellow-300"> Not valid IOTA address.</p>
                        </Card>
                    ) : null}
                    <Card type={CardType.Outlined}>
                        <CardBody title="Target Address" />
                        <Input
                            type={InputType.Text}
                            value={editTargetAddress}
                            disabled={disableEdit}
                            onChange={handleTargetAddressChange}
                        />
                        {!isTargetCurrentAddress && (
                            <Button
                                onClick={handleSetCurrentAsTargetAddress}
                                text="Use current"
                                disabled={disableEdit}
                            />
                        )}
                    </Card>
                    {isWrongCombination ? (
                        <Card>
                            <p className="text-yellow-300">
                                {' '}
                                Use your account as target address to be able to set this name as
                                default.
                            </p>
                        </Card>
                    ) : null}
                    <Card type={CardType.Outlined}>
                        <CardBody title="Set as default name" subtitle="Enables reverse lookup." />
                        <Checkbox
                            isChecked={editIsDefaultName}
                            isDisabled={disableEdit}
                            onCheckedChange={handleReverseLookupChange}
                        />
                    </Card>
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
    );
}
