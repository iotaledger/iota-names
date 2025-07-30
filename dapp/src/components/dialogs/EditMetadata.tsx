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
import { useEffect, useMemo, useState } from 'react';
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

type SetAction =
    | {
          type: 'set';
      }
    | {
          type: 'unset';
      }
    | {
          type: 'none';
      };

const METADATA_FIELDS = [
    { key: 'twitter/x', label: 'Twitter/X', allowedKey: 'twitterX' },
    { key: 'discord', label: 'Discord', allowedKey: 'discord' },
    { key: 'github', label: 'Github', allowedKey: 'github' },
    { key: 'email', label: 'Email', allowedKey: 'email' },
    { key: 'btc', label: 'Btc', allowedKey: 'btc' },
    { key: 'eth', label: 'Eth', allowedKey: 'eth' },
    { key: 'ltc', label: 'Ltc', allowedKey: 'ltc' },
    { key: 'doge', label: 'Doge', allowedKey: 'doge' },
    { key: 'sol', label: 'Sol', allowedKey: 'sol' },
    { key: 'sui', label: 'Sui', allowedKey: 'sui' },
    { key: 'website', label: 'Website', allowedKey: 'website' },
    { key: 'ipfs', label: 'Ipfs', allowedKey: 'ipfs' },
    { key: 'arweave', label: 'Arweave', allowedKey: 'arweave' },
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
            const value = nameRecord?.nameRecord.data[key] || '';
            initial[key] = { selected: !!value, data: value };
        });
        return initial;
    });

    const [action, setAction] = useState<SetAction>({ type: 'none' });
    const [shouldBuildUpdates, setShouldBuildUpdates] = useState(false);

    const toggleMetadata = (key: string) => {
        setMetadata((prev) => ({
            ...prev,
            [key]: { ...prev[key], selected: !prev[key].selected },
        }));
    };

    const updateMetadataData = (key: string, data: string) => {
        setMetadata((prev) => ({
            ...prev,
            [key]: { ...prev[key], data },
        }));
    };

    useEffect(() => {
        if (nameRecord?.nameRecord?.data) {
            const newMetadata: Record<string, { selected: boolean; data: string }> = {};
            METADATA_FIELDS.forEach(({ key }) => {
                const value = nameRecord.nameRecord.data[key] || '';
                newMetadata[key] = { selected: !!value, data: value };
            });
            setMetadata(newMetadata);
        }
    }, [nameRecord?.nameRecord?.data]);

    const updates: NameUpdate[] = useMemo(() => {
        if (!shouldBuildUpdates) return [];

        const updatesArray: NameUpdate[] = [];
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

                if (action.type === 'set' && field.data && field.selected) {
                    updatesArray.push({
                        type: 'set-data',
                        nftId,
                        key: ALLOWED_METADATA[allowedKey],
                        value: field.data,
                        isSubname: isNameSubname,
                    });
                } else if (action.type === 'unset' && !field.selected) {
                    updatesArray.push({
                        type: 'unset-data',
                        nftId,
                        key: ALLOWED_METADATA[allowedKey],
                        isSubname: isNameSubname,
                    });
                }
            });
        }

        return updatesArray;
    }, [shouldBuildUpdates, nameRecord, action, metadata, subnamesOwned]);

    const { data: updateTransaction, isLoading: isUpdating } = useUpdateNameTransaction({
        address: account?.address || '',
        updates,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } =
        useSignAndExecuteTransaction();

    const { mutate: saveMetadata, isPending: isSaving } = useMutation({
        async mutationFn() {
            if (!updateTransaction) return;
            const tx = await signAndExecuteTransaction({
                transaction: updateTransaction.transaction,
            });
            await iotaClient.waitForTransaction({ digest: tx.digest });
            queryClient.invalidateQueries({ queryKey: queryKey.nameRecord(name) });
        },
        onSuccess() {
            setShouldBuildUpdates(false);
            setAction({ type: 'none' });
            setOpen(false);
            toast.success(`Successfully updated metadata for ${normalizeIotaName(name)}`);
        },
        onError: (error) => {
            setShouldBuildUpdates(false);
            setAction({ type: 'none' });
            toast.error(error.message);
        },
    });

    const handleApplyClick = () => {
        const hasSelected = Object.values(metadata).some((field) => field.selected);
        const hasData = Object.values(metadata).some((field) => field.selected && field.data);

        setAction({ type: hasSelected && hasData ? 'set' : 'unset' });
        setShouldBuildUpdates(true);
    };

    useEffect(() => {
        if (shouldBuildUpdates && updates.length > 0 && updateTransaction) {
            saveMetadata();
        }
    }, [shouldBuildUpdates, updates, updateTransaction, saveMetadata]);

    const isLoading = isUpdating || isSigning || isSaving;
    const disableApply = isLoading || !Object.values(metadata).some((field) => field.selected);

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
                            <div className="flex flex-wrap gap-sm">
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

                        <div className="flex w-full flex-row gap-x-xs">
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
                                onClick={handleApplyClick}
                                fullWidth
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
