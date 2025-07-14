// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Link, Warning } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonSize,
    ButtonType,
    Checkbox,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubname } from '@iota/iota-names-sdk';
import { isValidIotaAddress } from '@iota/iota-sdk/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useState } from 'react';

import { NameRecordData, queryKey, useNameRecord, useRegistrationNfts } from '@/hooks';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { getNameObject, isNameRecordExpired } from '@/lib/utils/names';

type SetLinkedAddressDialogProps = {
    name: string;
    setOpen: (b: boolean) => void;
};

export function SetLinkedAddressDialog({ name, setOpen }: SetLinkedAddressDialogProps) {
    const queryClient = useQueryClient();
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();

    const [editTargetAddress, setEditTargetAddress] = useState<string>('');
    const [isUnlinking, setIsUnlinking] = useState<boolean>(false);

    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);
    const { data: ownedSubnames } = useRegistrationNfts('subname');

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : false;
    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord.nameRecord) : false;

    const hasTargetAddress = editTargetAddress.length > 0;
    const isAddressValid = isValidIotaAddress(editTargetAddress);
    const isTargetUsedInName = editTargetAddress === nameRecord?.nameRecord.targetAddress;

    useEffect(() => {
        if (nameRecord && editTargetAddress.length === 0 && !isUnlinking) {
            setEditTargetAddress(nameRecord.nameRecord.targetAddress ?? '');
        }
    }, [nameRecord, isUnlinking]);

    function buildUpdates(): NameUpdate[] {
        const updates: NameUpdate[] = [];
        const nftId = isNameSubname
            ? getNameObject(ownedSubnames ?? [], nameRecord?.nameRecord.name ?? '')
            : nameRecord?.nameRecord.nftId;

        if (nameRecord && nftId) {
            if (isUnlinking && nameRecord.nameRecord.targetAddress) {
                updates.push({
                    type: 'set-target-address',
                    nftId,
                    address: undefined,
                    isSubname: !!isNameSubname,
                });
            } else if (hasTargetAddress && isAddressValid && !isTargetUsedInName) {
                updates.push({
                    type: 'set-target-address',
                    nftId,
                    address: editTargetAddress,
                    isSubname: !!isNameSubname,
                });
            }
        }

        return updates;
    }

    const updates = buildUpdates();

    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingTx,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        updates,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } =
        useSignAndExecuteTransaction();

    const { mutate: apply, isPending: isApplying } = useMutation({
        async mutationFn() {
            if (!updateNameTransaction) return;
            const txResult = await signAndExecuteTransaction({
                transaction: updateNameTransaction,
            });

            await iotaClient.waitForTransaction({ digest: txResult.digest });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey.nameRecord(name) });
            setOpen(false);
        },
    });

    function handleClose() {
        setOpen(false);
    }

    function handleAddressChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
        setEditTargetAddress(value);
    }

    function handleUseCurrent() {
        return account?.address && setEditTargetAddress(account.address);
    }

    const isLoading = isApplying || isSigning || isLoadingTx;
    const disableEdit = isNameRecordLoading || isExpired || isSigning || isUnlinking;
    const disableApply = updates.length === 0 || isExpired || isLoading;

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header title="Set Linked Address" onClose={handleClose} />

                <DialogBody>
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col gap-y-md">
                            <Input
                                type={InputType.Text}
                                label="Enter Target Address"
                                placeholder="Enter Target Address"
                                value={editTargetAddress}
                                onChange={handleAddressChange}
                                onClearInput={() => setEditTargetAddress('')}
                                disabled={disableEdit}
                                errorMessage={
                                    hasTargetAddress && !isAddressValid
                                        ? 'Not a valid IOTA address'
                                        : updateNameError?.message
                                }
                            />

                            {nameRecord?.nameRecord.targetAddress && (
                                <div className="mt-sm">
                                    <Checkbox
                                        label="Remove Linked Address from Name"
                                        isChecked={isUnlinking}
                                        onCheckedChange={(e) => {
                                            const checked = e.target.checked;
                                            setIsUnlinking(checked);
                                            if (checked) {
                                                setEditTargetAddress('');
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {account?.address &&
                                editTargetAddress !== account.address &&
                                !isUnlinking && (
                                    <div className="flex justify-end w-full">
                                        <Button
                                            text="Link to Current Address"
                                            icon={<Link />}
                                            onClick={handleUseCurrent}
                                            disabled={disableEdit}
                                            size={ButtonSize.Small}
                                            type={ButtonType.Secondary}
                                        />
                                    </div>
                                )}

                            {nameRecord?.nameRecord.targetAddress && editTargetAddress ? (
                                <div className="flex w-full break-all">
                                    <InfoBox
                                        type={InfoBoxType.Success}
                                        style={InfoBoxStyle.Default}
                                        icon={<Link />}
                                        title="Name connected to"
                                        supportingText={editTargetAddress}
                                    />
                                </div>
                            ) : nameRecord?.nameRecord.targetAddress ? (
                                <div className="flex w-full break-all">
                                    <InfoBox
                                        type={InfoBoxType.Warning}
                                        style={InfoBoxStyle.Default}
                                        icon={<Warning />}
                                        title="No address will be linked"
                                        supportingText="After applying, the linked address will be removed from the name"
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="flex w-full flex-row gap-x-xs mt-xs">
                            <Button
                                type={ButtonType.Secondary}
                                text="Cancel"
                                onClick={handleClose}
                                fullWidth
                            />
                            <Button
                                type={ButtonType.Primary}
                                text="Apply"
                                icon={isLoading ? <LoadingIndicator /> : null}
                                onClick={() => apply()}
                                disabled={disableApply}
                                fullWidth
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
