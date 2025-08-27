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
import { getUserFriendlyErrorMessage } from '@/lib/utils';
import { getNameObject } from '@/lib/utils/names';

interface EditMetadataDialogProps {
    name: string;
    setOpen: (bool: boolean) => void;
}

const METADATA_KEYS = [
    { label: 'Twitter/X', allowedKey: 'twitterX' },
    { label: 'Discord', allowedKey: 'discord' },
    { label: 'Github', allowedKey: 'github' },
    { label: 'Email', allowedKey: 'email' },
    { label: 'Btc', allowedKey: 'btc' },
    { label: 'Eth', allowedKey: 'eth' },
    { label: 'Ltc', allowedKey: 'ltc' },
    { label: 'Doge', allowedKey: 'doge' },
    { label: 'Sol', allowedKey: 'sol' },
    { label: 'Sui', allowedKey: 'sui' },
    { label: 'Website', allowedKey: 'website' },
    { label: 'Ipfs', allowedKey: 'ipfs' },
    { label: 'Arweave', allowedKey: 'arweave' },
] as const satisfies { label: string; allowedKey: keyof typeof ALLOWED_METADATA }[];

const METADATA_FIELDS = METADATA_KEYS.map(({ label, allowedKey }) => ({
    key: ALLOWED_METADATA[allowedKey],
    label,
    allowedKey,
}));

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

                if (field.selected && (currentField === undefined || field.data !== currentField)) {
                    updates.push({
                        type: 'set-data',
                        nftId,
                        key: key,
                        value: field.data,
                        isSubname: isNameSubname,
                    });
                } else if (!field.selected && currentField !== undefined) {
                    updates.push({
                        type: 'unset-data',
                        nftId,
                        key: key,
                        isSubname: isNameSubname,
                    });
                }
            });
        }

        return updates;
    })();

    const {
        data: updateTransaction,
        isLoading: isUpdateNameLoading,
        error: updateNameError,
    } = useUpdateNameTransaction({
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
            toast.error(getUserFriendlyErrorMessage(error));
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

    useEffect(() => {
        if (updateNameError) {
            toast.error(getUserFriendlyErrorMessage(updateNameError));
        }
    }, [updateNameError]);

    const isLoading = isUpdateNameLoading || isSigning || isSaving;
    const disableApply = isLoading || updates.length === 0 || !!updateNameError;

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
