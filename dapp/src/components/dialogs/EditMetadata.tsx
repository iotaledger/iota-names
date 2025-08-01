// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonType,
    Chip,
    ChipType,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { ALLOWED_METADATA, isSubname, normalizeIotaName } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
    NameRecordData,
    NameUpdate,
    queryKey,
    useNameRecord,
    useRegistrationNfts,
    useUpdateNameTransaction,
} from '@/hooks';
import { getNameObject } from '@/lib/utils/names';

interface EditMetadataDialogProps {
    name: string;
    setOpen: (bool: boolean) => void;
}

const METADATA_FIELDS = [
    { key: ALLOWED_METADATA.twitterX, label: 'Twitter/X', allowedKey: 'twitterX' },
    { key: ALLOWED_METADATA.discord, label: 'Discord', allowedKey: 'discord' },
    { key: ALLOWED_METADATA.github, label: 'Github', allowedKey: 'github' },
    { key: ALLOWED_METADATA.email, label: 'Email', allowedKey: 'email' },
    { key: ALLOWED_METADATA.btc, label: 'Btc', allowedKey: 'btc' },
    { key: ALLOWED_METADATA.eth, label: 'Eth', allowedKey: 'eth' },
    { key: ALLOWED_METADATA.ltc, label: 'Ltc', allowedKey: 'ltc' },
    { key: ALLOWED_METADATA.doge, label: 'Doge', allowedKey: 'doge' },
    { key: ALLOWED_METADATA.sol, label: 'Sol', allowedKey: 'sol' },
    { key: ALLOWED_METADATA.sui, label: 'Sui', allowedKey: 'sui' },
    { key: ALLOWED_METADATA.website, label: 'Website', allowedKey: 'website' },
    { key: ALLOWED_METADATA.ipfs, label: 'Ipfs', allowedKey: 'ipfs' },
    { key: ALLOWED_METADATA.arweave, label: 'Arweave', allowedKey: 'arweave' },
] as const;

export function EditMetadataDialog({ name, setOpen }: EditMetadataDialogProps) {
    const account = useCurrentAccount();
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();

    const { data: nameRecordData } = useNameRecord(name);
    const { data: subnamesOwned } = useRegistrationNfts('subname');

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const [metadata, setMetadata] = useState(() => {
        const initial: Record<string, { selected: boolean; data: string }> = {};
        METADATA_FIELDS.forEach(({ key }) => {
            const data = nameRecord?.nameRecord.data[key];
            initial[key] = {
                selected: data !== undefined,
                data: data || '',
            };
        });
        return initial;
    });

    // Sync the name metadata
    useEffect(() => {
        if (nameRecord?.nameRecord?.data) {
            const newMetadata: Record<string, { selected: boolean; data: string }> = {};
            METADATA_FIELDS.forEach(({ key }) => {
                const data = nameRecord?.nameRecord.data[key];
                newMetadata[key] = {
                    selected: data !== undefined,
                    data: data || '',
                };
            });
            setMetadata(newMetadata);
        }
    }, [nameRecord?.nameRecord?.data]);

    const updates: NameUpdate[] = (() => {
        const updates: NameUpdate[] = [];
        const isNameSubname = nameRecord?.nameRecord
            ? isSubname(nameRecord.nameRecord.name)
            : false;
        const nftId =
            isNameSubname && nameRecord
                ? getNameObject(subnamesOwned ?? [], nameRecord.nameRecord.name)
                : nameRecord?.nameRecord.nftId;

        if (nameRecord && nftId) {
            METADATA_FIELDS.forEach(({ key, allowedKey }) => {
                const field = metadata[key];
                const currentField = nameRecord.nameRecord.data[key];

                if (field.selected && currentField === undefined) {
                    updates.push({
                        type: 'set-data',
                        nftId,
                        key: ALLOWED_METADATA[allowedKey],
                        value: field.data,
                        isSubname: isNameSubname,
                    });
                } else if (!field.selected && currentField !== undefined) {
                    updates.push({
                        type: 'unset-data',
                        nftId,
                        key: ALLOWED_METADATA[allowedKey],
                        isSubname: isNameSubname,
                    });
                }
            });
        }

        return updates;
    })();

    const { data: updateTransaction, isLoading: isUpdating } = useUpdateNameTransaction({
        address: account?.address || '',
        updates,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } =
        useSignAndExecuteTransaction();

    const { mutate: handleApply, isPending: isSaving } = useMutation({
        async mutationFn() {
            if (!updateTransaction) return;
            const tx = await signAndExecuteTransaction({
                transaction: updateTransaction.transaction,
            });
            await iotaClient.waitForTransaction({ digest: tx.digest });
        },
        onSuccess() {
            setOpen(false);
            toast.success(`Successfully updated metadata for ${normalizeIotaName(name)}`);
            queryClient.invalidateQueries({ queryKey: queryKey.nameRecord(name) });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    function toggleMetadata(key: string) {
        setMetadata((prev) => ({
            ...prev,
            [key]: { ...prev[key], selected: !prev[key].selected },
        }));
    }

    function updateMetadataData(key: string, data: string) {
        setMetadata((prev) => ({
            ...prev,
            [key]: { ...prev[key], data },
        }));
    }

    const isLoading = isUpdating || isSigning || isSaving;
    const disableApply = isLoading || updates.length === 0;

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent isFixedPosition position={DialogPosition.Right}>
                <Header title="Edit Metadata" onClose={() => setOpen(false)} />
                <DialogBody>
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col gap-md">
                            <p className="text-label-md y color text-names-neutral-70">
                                Select type
                            </p>
                            <div className="flex flex-wrap gap-xs">
                                {METADATA_FIELDS.map(({ key, label }) => (
                                    <Chip
                                        key={key}
                                        label={label}
                                        selected={metadata[key]?.selected || false}
                                        type={
                                            metadata[key]?.selected
                                                ? ChipType.Brand
                                                : ChipType.Outline
                                        }
                                        onClick={() => toggleMetadata(key)}
                                    />
                                ))}
                            </div>

                            <div className="flex flex-col gap-xs">
                                {METADATA_FIELDS.map(
                                    ({ key, label }) =>
                                        metadata[key]?.selected && (
                                            <Input
                                                key={key}
                                                type={InputType.Text}
                                                label={label}
                                                value={metadata[key]?.data || ''}
                                                onChange={({ target: { value } }) =>
                                                    updateMetadataData(key, value)
                                                }
                                            />
                                        ),
                                )}
                            </div>
                        </div>
                    </div>
                </DialogBody>

                <div className="flex w-full flex-row gap-x-xs px-md--rs pb-md--rs pt-sm--rs">
                    <Button
                        type={ButtonType.Secondary}
                        text="Cancel"
                        onClick={() => setOpen(false)}
                        fullWidth
                    />
                    <Button
                        icon={isLoading ? <LoadingIndicator /> : null}
                        text="Apply"
                        disabled={disableApply}
                        type={ButtonType.Primary}
                        onClick={() => handleApply()}
                        fullWidth
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
