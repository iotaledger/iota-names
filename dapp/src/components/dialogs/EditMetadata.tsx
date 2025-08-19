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
import { getUserFriendlyErrorMessage } from '@/lib/utils';
import { getNameObject } from '@/lib/utils/names';

interface EditMetadataDialogProps {
    name: string;
    setOpen: (bool: boolean) => void;
}

const METADATA_KEYS = [
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
            if (!/^[a-z0-9._]{2,32}(#[0-9]{4})?$/i.test(value))
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
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Invalid email format';
            if (value.length > 254) return 'Email too long';
            return null;
        },
    },
    {
        key: 'btc',
        label: 'BTC',
        allowedKey: 'btc',
        validate: (value: string) => {
            if (!value) return 'BTC field is empty';
            const legacyRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
            const bech32Regex = /^bc1[a-z0-9]{39,59}$/;
            const taproot = /^bc1p[a-z0-9]{58}$/;
            if (!legacyRegex.test(value) && !bech32Regex.test(value) && !taproot.test(value)) {
                return 'Invalid Bitcoin address format';
            }
            return null;
        },
    },
    {
        key: 'eth',
        label: 'ETH',
        allowedKey: 'eth',
        validate: (value: string) => {
            if (!value) return 'ETH field is empty';
            if (!value.startsWith('0x')) return 'ETH address must start with 0x';
            if (!/^0x[0-9a-fA-F]{40}$/.test(value)) return 'Invalid Ethereum address format';
            return null;
        },
    },
    {
        key: 'ltc',
        label: 'LTC',
        allowedKey: 'ltc',
        validate: (value: string) => {
            if (!value) return 'LTC field is empty';
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
        label: 'DOGE',
        allowedKey: 'doge',
        validate: (value: string) => {
            if (!value) return 'DOGE field is empty';
            if (!/^[DA][5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(value)) {
                return 'Invalid Dogecoin address format';
            }
            return null;
        },
    },
    {
        key: 'sol',
        label: 'SOL',
        allowedKey: 'sol',
        validate: (value: string) => {
            if (!value) return 'SOL field is empty';
            if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
                return 'Invalid Solana address format (32-44 base58 characters)';
            }
            return null;
        },
    },
    {
        key: 'sui',
        label: 'SUI',
        allowedKey: 'sui',
        validate: (value: string) => {
            if (!value) return 'SUI field is empty';
            if (!value.startsWith('0x')) return 'SUI address must start with 0x';
            if (!/^0x[0-9a-fA-F]{64}$/.test(value))
                return 'Invalid SUI address format (66 characters total)';
            return null;
        },
    },
    {
        key: 'website',
        label: 'Website',
        allowedKey: 'website',
        validate: (value: string) => {
            if (!value) return 'Website field is empty';
            let urlToValidate = value;
            if (!value.startsWith('http://') && !value.startsWith('https://')) {
                urlToValidate = `https://${value}`;
            }
            try {
                const url = new URL(urlToValidate);
                if (!url.hostname || url.hostname.length === 0) {
                    return 'Invalid website hostname';
                }
                const hostnameRegex =
                    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                if (!hostnameRegex.test(url.hostname)) {
                    return 'Invalid website format';
                }
                const parts = url.hostname.split('.');
                if (parts.length < 2) {
                    return 'Website must include a valid domain (e.g., example.com)';
                }
                const tld = parts[parts.length - 1];
                if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
                    return 'Invalid top-level domain (TLD)';
                }
                return null;
            } catch (error) {
                return `Invalid URL format: ${error instanceof Error ? error.message : 'Invalid URL format'}`;
            }
        },
    },
    {
        key: 'ipfs',
        label: 'IPFS',
        allowedKey: 'ipfs',
        validate: (value: string) => {
            if (!value) return 'IPFS field is empty';

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

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    function validateField(key: string, value: string): string | null {
        const metadataKey = METADATA_KEYS.find((item) =>
            METADATA_FIELDS.find(
                (field) => field.key === key && field.allowedKey === item.allowedKey,
            ),
        );
        return metadataKey ? metadataKey.validate(value) : null;
    }

    function validateAllFields(): boolean {
        const errors: Record<string, string> = {};
        let hasErrors = false;

        METADATA_FIELDS.forEach(({ key }) => {
            const field = metadata[key];
            if (field?.selected && field.data) {
                if (!field.data || field.data.trim() === '') {
                    errors[key] = 'Field is required';
                    hasErrors = true;
                } else {
                    const error = validateField(key, field.data);
                    if (error) {
                        errors[key] = error;
                        hasErrors = true;
                    }
                }
            }
        });

        setValidationErrors(errors);
        return !hasErrors;
    }

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

    const { data: updateTransaction, isLoading: isUpdating } = useUpdateNameTransaction({
        address: account?.address || '',
        updates,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } =
        useSignAndExecuteTransaction();

    const { mutate: handleApply, isPending: isSaving } = useMutation({
        async mutationFn() {
            if (!updateTransaction) return;
            if (!validateAllFields()) return;
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

    function updateMetadataData(key: string, data: string) {
        setMetadata((prev) => ({
            ...prev,
            [key]: { ...prev[key], data },
        }));

        if (data && data.trim() !== '') {
            const error = validateField(key, data);
            setValidationErrors((prev) => ({
                ...prev,
                [key]: error || '',
            }));
        } else {
            const field = metadata[key];
            if (field?.selected) {
                setValidationErrors((prev) => ({
                    ...prev,
                    [key]: 'Field is required',
                }));
            } else {
                setValidationErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[key];
                    return newErrors;
                });
            }
        }
    }
    function toggleMetadata(key: string) {
        setMetadata((prev) => ({
            ...prev,
            [key]: { ...prev[key], selected: !prev[key].selected },
        }));
        if (metadata[key]?.selected) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    }

    const isLoading = isUpdating || isSigning || isSaving;
    const hasValidationErrors = Object.values(validationErrors).some((error) => error);
    const disableApply = isLoading || updates.length === 0 || hasValidationErrors;

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
                                                errorMessage={validationErrors[key] || undefined}
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
