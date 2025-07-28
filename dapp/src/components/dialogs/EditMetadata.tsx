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
import { useState } from 'react';
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

const METADATA_CONFIG: {
    key: string;
    label: string;
    allowedKey: keyof typeof ALLOWED_METADATA;
}[] = [
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
];

export function EditMetadataDialog({ name, setOpen }: EditMetadataDialogProps) {
    const account = useCurrentAccount();
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();

    const { data: nameRecordData } = useNameRecord(name);
    const { data: subnamesOwned } = useRegistrationNfts('subname');

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : null;
    const nftId =
        isNameSubname && nameRecord
            ? getNameObject(subnamesOwned ?? [], nameRecord.nameRecord.name)
            : nameRecord?.nameRecord.nftId;

    const updates: NameUpdate[] = [];
    const [metadataState, setMetadataState] = useState(() => {
        const initialState: Record<string, { selected: boolean; data: string }> = {};

        METADATA_CONFIG.forEach(({ key }) => {
            const value = nameRecord?.nameRecord.data[key] || '';
            initialState[key] = {
                selected: !!value,
                data: value,
            };
        });

        return initialState;
    });

    const handleMetadataToggle = (key: string) => {
        setMetadataState((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                selected: !prev[key].selected,
            },
        }));

        setAction({
            type: metadataState[key].selected ? 'unset' : 'set',
        });
    };

    const handleMetadataChange = (key: string, value: string) => {
        setMetadataState((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                data: value,
            },
        }));
    };

    const MetadataChips = () => (
        <div className="flex flex-wrap gap-xs">
            {METADATA_CONFIG.map(({ key, label }) => (
                <Chip
                    key={key}
                    label={label}
                    selected={metadataState[key].selected}
                    type={metadataState[key].selected ? ChipType.Brand : ChipType.Outline}
                    onClick={() => handleMetadataToggle(key)}
                />
            ))}
        </div>
    );

    const MetadataInputs = () => (
        <div className="flex flex-wrap gap-xs mt-xs">
            {METADATA_CONFIG.map(
                ({ key, label }) =>
                    metadataState[key].selected && (
                        <Input
                            key={key}
                            type={InputType.Text}
                            label={label}
                            value={metadataState[key].data}
                            onChange={({ target: { value } }) => handleMetadataChange(key, value)}
                        />
                    ),
            )}
        </div>
    );
    const [action, setAction] = useState<SetAction>({ type: 'none' });
    if (nameRecord && nftId) {
        METADATA_CONFIG.forEach(({ key, allowedKey }) => {
            const metadata = metadataState[key];

            if (action.type === 'set' && metadata.data) {
                updates.push({
                    type: 'set-data',
                    nftId,
                    key: ALLOWED_METADATA[allowedKey],
                    value: metadata.data,
                });
            } else if (action.type === 'unset' && !metadata.selected) {
                updates.push({
                    type: 'unset-data',
                    nftId,
                    key: ALLOWED_METADATA[allowedKey],
                });
            }
        });
    }

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
            setOpen(false);
            toast.success(`Successfully updated metadata for ${normalizeIotaName(name)}`);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const isLoading = isUpdating || isSigning || isSaving;
    function handleClose() {
        setOpen(false);
    }

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent isFixedPosition position={DialogPosition.Right}>
                <Header title="Edit Metadata" onClose={handleClose} />
                <DialogBody>
                    <div className="flex flex-wrap gap-xs">Select type</div>
                    <div className="flex flex-wrap gap-xs">
                        <MetadataChips />
                    </div>
                    <div className="flex flex-wrap gap-xs mt-xs">
                        <MetadataInputs />
                    </div>
                    <div className="flex w-full flex-row gap-x-xs mt-xs">
                        <Button
                            type={ButtonType.Secondary}
                            text="Cancel"
                            onClick={handleClose}
                            fullWidth
                        />
                        <Button
                            icon={isLoading ? <LoadingIndicator /> : null}
                            text={'Apply'}
                            // disabled={disableApplyButton}
                            type={ButtonType.Primary}
                            onClick={() => saveMetadata()}
                            fullWidth
                        />
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
