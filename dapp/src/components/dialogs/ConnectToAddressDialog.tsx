// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Add, Copy, Link, Warning } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonSize,
    ButtonType,
    Checkbox,
    Chip,
    ChipType,
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
    Panel,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubname } from '@iota/iota-names-sdk';
import { formatAddress, isValidIotaAddress } from '@iota/iota-sdk/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { NameRecordData, queryKey, useNameRecord, useRegistrationNfts } from '@/hooks';
import { useGetDefaultName } from '@/hooks/useGetDefaultName';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { copyToClipboard } from '@/lib/utils/copyToClipboard';
import { denormalizeName } from '@/lib/utils/format/formatNames';
import { getNameObject, isNameRecordExpired } from '@/lib/utils/names';

interface ConnectToAddressDialogProps {
    name: string;
    setOpen: (open: boolean) => void;
}

export function ConnectToAddressDialog({ name, setOpen }: ConnectToAddressDialogProps) {
    const queryClient = useQueryClient();
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();

    const [editTargetAddress, setEditTargetAddress] = useState<string>('');
    const [editIsDefaultName, setEditIsDefaultName] = useState<boolean>(false);

    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);
    const { data: ownedSubnames } = useRegistrationNfts('subname');
    const { data: addressName } = useGetDefaultName(account?.address ?? '');

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : false;
    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord.nameRecord) : false;
    const currentTargetAddress = nameRecord?.nameRecord.targetAddress ?? '';

    // Sync name target address
    useEffect(() => {
        setEditTargetAddress(currentTargetAddress);
    }, [currentTargetAddress]);

    // Sync address current default name
    useEffect(() => {
        setEditIsDefaultName(addressName === name);
    }, [addressName]);

    const hasAddressChange = editTargetAddress !== currentTargetAddress;
    const hasDefaultChange = (addressName === name) !== editIsDefaultName;
    const isValidAddressOrEmpty = editTargetAddress === '' || isValidIotaAddress(editTargetAddress);
    const hasChanges = (hasAddressChange && isValidAddressOrEmpty) || hasDefaultChange;

    const updates: NameUpdate[] = [];
    const nftId = isNameSubname
        ? getNameObject(ownedSubnames ?? [], nameRecord?.nameRecord.name ?? '')
        : nameRecord?.nameRecord.nftId;

    if (hasAddressChange && nftId) {
        updates.push({
            type: 'set-target-address',
            nftId,
            address: editTargetAddress || undefined,
            isSubname: !!isNameSubname,
        });
    }

    if (hasDefaultChange) {
        if (editIsDefaultName) {
            updates.push({ type: 'set-default', name });
        } else {
            updates.push({ type: 'unset-default' });
        }
    }

    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingTx,
    } = useUpdateNameTransaction({ address: account?.address || '', updates });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } =
        useSignAndExecuteTransaction();

    const {
        mutate: apply,
        isPending: isApplying,
        isSuccess,
    } = useMutation({
        async mutationFn() {
            if (!updateNameTransaction) return;
            const txResult = await signAndExecuteTransaction({
                transaction: updateNameTransaction.transaction,
            });
            await iotaClient.waitForTransaction({ digest: txResult.digest });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey.nameRecord(name) });
            queryClient.invalidateQueries({
                queryKey: queryKey.defaultName(account?.address || ''),
            });
            if (editTargetAddress.length === 0) {
                toast.success(`Successfully disconnected @${denormalizeName(name)}`);
                setOpen(false);
            } else if (editTargetAddress !== account?.address) {
                toast.success(
                    `Successfully connected @${denormalizeName(name)} to address ${formatAddress(editTargetAddress)}`,
                );
                setOpen(false);
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    function handleClose() {
        setOpen(false);
    }

    function handleAddressChange(e: ChangeEvent<HTMLInputElement>) {
        setEditTargetAddress(e.target.value);
    }

    function handleUseCurrent() {
        if (account?.address) setEditTargetAddress(account.address);
    }

    function copyAddressToClipboard() {
        if (account?.address) {
            copyToClipboard(account.address);
        }
    }

    const isLoading = isApplying || isSigning || isLoadingTx;
    const disableEdit = isNameRecordLoading || isExpired || isSigning;
    const disableApply = !hasChanges || !isValidAddressOrEmpty || isExpired || isLoading;
    const cleanName = denormalizeName(name);

    const showAddressWarning = !!addressName && addressName !== name && editIsDefaultName;

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header
                    title={isSuccess ? 'Success' : 'Connect to Address'}
                    onClose={handleClose}
                />

                <DialogBody>
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col gap-y-md">
                            {isSuccess ? (
                                <div className="flex flex-col gap-y-md items-center text-center">
                                    <div className="flex flex-col items-center gap-y-sm">
                                        {editIsDefaultName ? (
                                            <span className="text-title-lg text-names-neutral-100">
                                                @{denormalizeName(name)}
                                            </span>
                                        ) : null}
                                        <Chip
                                            leadingElement={<Link className="w-4 h-4" />}
                                            label={formatAddress(account?.address || '')}
                                            trailingElement={<Copy className="w-4 h-4" />}
                                            onClick={copyAddressToClipboard}
                                            type={
                                                editIsDefaultName
                                                    ? ChipType.Success
                                                    : ChipType.Elevated
                                            }
                                        />
                                    </div>
                                    <span className="text-body-md text-names-neutral-70">
                                        {editIsDefaultName
                                            ? 'Address linked successfully'
                                            : `@${denormalizeName(name)} is no longer linked to an address`}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-y-xxs">
                                        <span className="text-title-md text-names-neutral-100">
                                            Link to Address
                                        </span>
                                        <Input
                                            type={InputType.Text}
                                            label={`Select a target address to connect to @${cleanName}`}
                                            placeholder="Enter Address"
                                            value={editTargetAddress}
                                            onChange={handleAddressChange}
                                            onClearInput={() => setEditTargetAddress('')}
                                            disabled={disableEdit}
                                            errorMessage={
                                                editTargetAddress && !isValidAddressOrEmpty
                                                    ? 'Not a valid IOTA address'
                                                    : updateNameError?.message
                                            }
                                        />
                                        {account?.address &&
                                            editTargetAddress !== account.address && (
                                                <div className="flex justify-start w-full">
                                                    <Button
                                                        text="Use Current Address"
                                                        icon={<Add />}
                                                        onClick={handleUseCurrent}
                                                        disabled={disableEdit}
                                                        size={ButtonSize.Small}
                                                        type={ButtonType.Ghost}
                                                    />
                                                </div>
                                            )}
                                        {nameRecord?.nameRecord.targetAddress &&
                                            !hasAddressChange &&
                                            editIsDefaultName && (
                                                <div className="flex w-full break-all">
                                                    <InfoBox
                                                        type={InfoBoxType.Success}
                                                        style={InfoBoxStyle.Default}
                                                        icon={<Link />}
                                                        title="Name connected to"
                                                        supportingText={
                                                            nameRecord.nameRecord.targetAddress
                                                        }
                                                    />
                                                </div>
                                            )}
                                    </div>
                                    <Panel bgColor="bg-names-neutral-10">
                                        <div className="flex flex-col rounded-lg p-md gap-y-md">
                                            <div className="flex flex-row items-start gap-x-md">
                                                <div className=" flex flex-col gap-y-xxs">
                                                    <span className="text-title-md text-names-neutral-100">
                                                        Set as Display name
                                                    </span>
                                                    <span className="text-body-md text-names-neutral-90">
                                                        Use Name publicly across the web instead of
                                                        current address.
                                                    </span>
                                                </div>
                                                <Checkbox
                                                    isChecked={editIsDefaultName}
                                                    isDisabled={
                                                        disableEdit ||
                                                        editTargetAddress !== account?.address
                                                    }
                                                    onCheckedChange={(checked) =>
                                                        setEditIsDefaultName(
                                                            !!checked.target.checked,
                                                        )
                                                    }
                                                />
                                            </div>
                                            {editIsDefaultName && (
                                                <Panel hasBorder bgColor="bg-names-neutral-10">
                                                    <div className="flex flex-col items-center gap-y-xxs py-md px-xs">
                                                        <span className="text-title-lg text-names-neutral-100">
                                                            @{denormalizeName(name)}
                                                        </span>
                                                        <Chip
                                                            label={formatAddress(
                                                                account?.address || '',
                                                            )}
                                                            trailingElement={
                                                                <Copy className="w-4 h-4" />
                                                            }
                                                            onClick={copyAddressToClipboard}
                                                            type={ChipType.Elevated}
                                                        />
                                                    </div>
                                                </Panel>
                                            )}

                                            {showAddressWarning && (
                                                <InfoBox
                                                    type={InfoBoxType.Warning}
                                                    style={InfoBoxStyle.Default}
                                                    icon={<Warning />}
                                                    title="Address has a linked name!"
                                                    supportingText="Continuing will override the previous address’s name"
                                                />
                                            )}
                                        </div>
                                    </Panel>
                                </>
                            )}
                        </div>

                        <div className="flex w-full flex-row gap-x-xs mt-xs">
                            <Button
                                type={ButtonType.Secondary}
                                text="Cancel"
                                onClick={handleClose}
                                fullWidth
                            />
                            {isSuccess ? (
                                <Button
                                    type={ButtonType.Primary}
                                    text="Finish"
                                    onClick={handleClose}
                                    fullWidth
                                />
                            ) : (
                                <Button
                                    type={ButtonType.Primary}
                                    text="Apply"
                                    icon={isLoading ? <LoadingIndicator /> : null}
                                    onClick={() => apply()}
                                    disabled={disableApply}
                                    fullWidth
                                />
                            )}
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
