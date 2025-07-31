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
    {
        key: 'twitter/x',
        label: 'Twitter/X',
        allowedKey: 'twitterX',
        validate: (value: string) => {
            if (!value) return 'Twitter field is empty';
            if (!value.startsWith('@')) return 'Twitter handle must start with @';
            if (value.length < 2) return 'Twitter handle too short';
            if (value.length > 16) return 'Twitter handle too long';
            if (!/^@[a-zA-Z0-9_]+$/.test(value)) return 'Invalid Twitter handle format';
            return null;
        },
    },
    {
        key: 'discord',
        label: 'Discord',
        allowedKey: 'discord',
        validate: (value: string) => {
            if (!value) return 'Discord field is empty';
            if (!/^.{2,32}(#[0-9]{4})?$/.test(value))
                return 'Discord format: username or username#1234';
            return null;
        },
    },
    {
        key: 'github',
        label: 'Github',
        allowedKey: 'github',
        validate: (value: string) => {
            if (!value) return 'Github field is empty';
            const cleanValue = value.replace(/^@/, '');
            if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(cleanValue)) {
                return 'Invalid GitHub username format';
            }
            return null;
        },
    },
    {
        key: 'email',
        label: 'Email',
        allowedKey: 'email',
        validate: (value: string) => {
            if (!value) return 'Email field is empty';
            const emailRegex =
                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!emailRegex.test(value)) return 'Invalid email format';
            if (value.length > 254) return 'Email too long';
            return null;
        },
    },
    {
        key: 'btc',
        label: 'Btc',
        allowedKey: 'btc',
        validate: (value: string) => {
            if (!value) return 'Btc field is empty';
            if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(value)) {
                return 'Invalid Bitcoin address';
            }
            return null;
        },
    },
    {
        key: 'eth',
        label: 'Eth',
        allowedKey: 'eth',
        validate: (value: string) => {
            if (!value) return 'Eth field is empty';
            if (!value.startsWith('0x')) return 'Eth address must start with 0x';
            if (!/^0x[0-9a-fA-F]{40}$/.test(value)) return 'Invalid Eth address format';
            return null;
        },
    },
    {
        key: 'ltc',
        label: 'Ltc',
        allowedKey: 'ltc',
        validate: (value: string) => {
            if (!value) return 'Ltc field is empty';
            const legacyRegex = /^[LM3][a-km-zA-HJ-NP-Z1-9]{25,33}$/;
            const bech32Regex = /^ltc1[a-z0-9]{39,59}$/;
            if (!legacyRegex.test(value) && !bech32Regex.test(value)) {
                return 'Invalid Litecoin address format';
            }
            return null;
        },
    },
    {
        key: 'doge',
        label: 'Doge',
        allowedKey: 'doge',
        validate: (value: string) => {
            if (!value) return 'Doge field is empty';
            if (!/^[DA][5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(value)) {
                return 'Invalid Dogecoin address format';
            }
            return null;
        },
    },
    {
        key: 'sol',
        label: 'Sol',
        allowedKey: 'sol',
        validate: (value: string) => {
            if (!value) return 'Sol field is empty';
            if (!/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(value)) {
                return 'Invalid Solana address format';
            }
            return null;
        },
    },
    {
        key: 'sui',
        label: 'Sui',
        allowedKey: 'sui',
        validate: (value: string) => {
            if (!value) return 'Sui field is empty';
            if (!value.startsWith('0x')) return 'Sui address must start with 0x';
            if (!/^0x[0-9a-fA-F]{64}$/.test(value)) return 'Invalid Sui address format';
            return null;
        },
    },
    {
        key: 'website',
        label: 'Website',
        allowedKey: 'website',
        validate: (value: string) => {
            if (!value) return 'Website field is empty';
            try {
                new URL(value);
                return null;
            } catch {
                return 'Invalid URL format';
            }
        },
    },
    {
        key: 'ipfs',
        label: 'Ipfs',
        allowedKey: 'ipfs',
        validate: (value: string) => {
            if (!value) return 'Ipfs field is empty';

            const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
            const cidv1Regex = /^b[a-z2-7]{58}$/;
            const ipfsUrlRegex =
                /^(ipfs:\/\/|https?:\/\/.+\/ipfs\/)(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58})$/;

            if (value.includes('ipfs://') || value.includes('/ipfs/')) {
                if (!ipfsUrlRegex.test(value)) {
                    return 'Invalid IPFS URL format';
                }
                return null;
            }

            if (!cidv0Regex.test(value) && !cidv1Regex.test(value)) {
                return 'Invalid IPFS hash. Use CIDv0 (Qm...) or CIDv1 (b...) format';
            }

            return null;
        },
    },
    {
        key: 'arweave',
        label: 'Arweave',
        allowedKey: 'arweave',
        validate: (value: string) => {
            if (!value) return 'Arweave field is empty';
            const arweaveIdRegex = /^[A-Za-z0-9_-]{43}$/;
            const arweaveUrlRegex =
                /^https?:\/\/(arweave\.net|ar\.io|arweave\.dev)\/([A-Za-z0-9_-]{43})$/;
            if (
                value.includes('arweave.net/') ||
                value.includes('ar.io/') ||
                value.includes('arweave.dev/')
            ) {
                if (!arweaveUrlRegex.test(value)) {
                    return 'Invalid Arweave URL format';
                }
                return null;
            }

            if (!arweaveIdRegex.test(value)) {
                return 'Invalid Arweave transaction ID (43 characters, base64url)';
            }

            return null;
        },
    },
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
    const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});

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

        const field = METADATA_FIELDS.find((f) => f.key === key);
        const error = field?.validate ? field.validate(data) : null;

        setValidationErrors((prev) => ({
            ...prev,
            [key]: error,
        }));
    };

    const hasValidationErrors = Object.values(validationErrors).some((error) => error !== null);

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
        const errors: Record<string, string | null> = {};
        let hasErrors = false;

        METADATA_FIELDS.forEach(({ key, validate }) => {
            if (metadata[key]?.selected && validate) {
                const error = validate(metadata[key]?.data || '');
                errors[key] = error;
                if (error) hasErrors = true;
            }
        });

        setValidationErrors(errors);

        if (hasErrors) {
            toast.error('Review errors before applying');
            return;
        }

        const hasSelected = Object.values(metadata).some((field) => field.selected);
        const hasData = Object.values(metadata).some((field) => field.selected && field.data);

        setAction({ type: hasSelected && hasData ? 'set' : 'unset' });
        setShouldBuildUpdates(true);
    };

    useEffect(() => {
        if (shouldBuildUpdates && updates.length > 0 && updateTransaction) {
            saveMetadata();
            setShouldBuildUpdates(false);
        }
    }, [shouldBuildUpdates, updates, updateTransaction, saveMetadata]);

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
    const isLoading = isUpdating || isSigning || isSaving;

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
                                                errorMessage={validationErrors[key] || undefined}
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
                                disabled={hasValidationErrors}
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
