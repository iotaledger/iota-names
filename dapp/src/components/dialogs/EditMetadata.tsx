// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Warning } from '@iota/apps-ui-icons';
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
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { ALLOWED_METADATA, isSubname, normalizeIotaName } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { z } from 'zod';

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
    { key: 'twitter/x', label: 'Twitter/X', allowedKey: 'twitterX' },
    { key: 'discord', label: 'Discord', allowedKey: 'discord' },
    { key: 'github', label: 'Github', allowedKey: 'github' },
    { key: 'email', label: 'Email', allowedKey: 'email' },
    { key: 'btc', label: 'BTC', allowedKey: 'btc' },
    { key: 'eth', label: 'ETH', allowedKey: 'eth' },
    { key: 'ltc', label: 'LTC', allowedKey: 'ltc' },
    { key: 'doge', label: 'DOGE', allowedKey: 'doge' },
    { key: 'sol', label: 'SOL', allowedKey: 'sol' },
    { key: 'sui', label: 'SUI', allowedKey: 'sui' },
    { key: 'website', label: 'Website', allowedKey: 'website' },
    { key: 'ipfs', label: 'IPFS', allowedKey: 'ipfs' },
    { key: 'arweave', label: 'Arweave', allowedKey: 'arweave' },
] as const;

// Zod schemas for validation mapped by allowedKey
type AllowedKey = (typeof METADATA_KEYS)[number]['allowedKey'];
const SCHEMAS: Record<AllowedKey, z.ZodString> = {
    twitterX: z
        .string()
        .min(2, 'Twitter handle too short')
        .max(16, 'Twitter handle too long')
        .regex(/^@/, 'Twitter handle must start with @')
        .regex(/^@[a-zA-Z0-9_]+$/, 'Invalid Twitter handle format'),
    discord: z
        .string()
        .regex(/^[a-z0-9._]{2,32}(#[0-9]{4})?$/i, 'Discord format: username or username#1234'),
    github: z
        .string()
        // allow optional leading @, then GitHub username rules
        .regex(
            /^@?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,
            'Invalid GitHub username format',
        ),
    email: z.string().email('Invalid email format').max(254, 'Email too long'),
    btc: z.string().refine(
        (v) => {
            const legacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
            const bech32 = /^bc1[a-z0-9]{39,59}$/;
            const taproot = /^bc1p[a-z0-9]{58}$/;
            return legacy.test(v) || bech32.test(v) || taproot.test(v);
        },
        { message: 'Invalid Bitcoin address format' },
    ),
    eth: z
        .string()
        .regex(/^0x/, 'ETH address must start with 0x')
        .regex(/^0x[0-9a-fA-F]{40}$/i, 'Invalid Ethereum address format'),
    ltc: z.string().refine(
        (v) => {
            const legacy = /^[LM3][a-km-zA-HJ-NP-Z1-9]{25,33}$/;
            const bech32 = /^ltc1[a-z0-9]{39,59}$/;
            return legacy.test(v) || bech32.test(v);
        },
        { message: 'Invalid Litecoin address format' },
    ),
    doge: z
        .string()
        .regex(/^[DA][5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/, 'Invalid Dogecoin address format'),
    sol: z
        .string()
        .regex(
            /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
            'Invalid Solana address format (32-44 base58 characters)',
        ),
    sui: z
        .string()
        .regex(/^0x/, 'SUI address must start with 0x')
        .regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid SUI address format (66 characters total)'),
    website: z.string().superRefine((v, ctx) => {
        let urlToValidate = v;
        if (!v.startsWith('http://') && !v.startsWith('https://')) {
            urlToValidate = `https://${v}`;
        }
        try {
            const url = new URL(urlToValidate);
            if (!url.hostname || url.hostname.length === 0) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid website hostname' });
                return;
            }
            const hostnameRegex =
                /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!hostnameRegex.test(url.hostname)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid website format' });
                return;
            }
            const parts = url.hostname.split('.');
            if (parts.length < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Website must include a valid domain (e.g., example.com)',
                });
                return;
            }
            const tld = parts[parts.length - 1];
            if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Invalid top-level domain (TLD)',
                });
            }
        } catch (error) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Invalid URL format: ${error instanceof Error ? error.message : 'Invalid URL format'}`,
            });
        }
    }),
    ipfs: z.string().superRefine((v, ctx) => {
        const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
        const cidv1Regex = /^b[a-z2-7]{58}$/;
        const ipfsUrlRegex =
            /^(ipfs:\/\/|https?:\/\/.+\/ipfs\/)(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58})$/;
        if (v.includes('ipfs://') || v.includes('/ipfs/')) {
            if (!ipfsUrlRegex.test(v)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid IPFS URL format' });
            }
            return;
        }
        if (!cidv0Regex.test(v) && !cidv1Regex.test(v)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid IPFS hash. Use CIDv0 (Qm...) or CIDv1 (b...) format',
            });
        }
    }),
    arweave: z.string().superRefine((v, ctx) => {
        const arweaveIdRegex = /^[A-Za-z0-9_-]{43}$/;
        const arweaveUrlRegex =
            /^https?:\/\/(arweave\.net|ar\.io|arweave\.dev)\/([A-Za-z0-9_-]{43})$/;
        if (v.includes('arweave.net/') || v.includes('ar.io/') || v.includes('arweave.dev/')) {
            if (!arweaveUrlRegex.test(v)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Invalid Arweave URL format',
                });
            }
            return;
        }
        if (!arweaveIdRegex.test(v)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid Arweave transaction ID (43 characters, base64url)',
            });
        }
    }),
};

const METADATA_FIELDS = METADATA_KEYS.map(({ label, allowedKey }) => ({
    key: ALLOWED_METADATA[allowedKey],
    label,
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

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
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
            METADATA_FIELDS.forEach(({ key }) => {
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
        data: updateNameTransaction,
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
            if (!updateNameTransaction) return;
            const tx = await signAndExecuteTransaction({
                transaction: updateNameTransaction.transaction,
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

    function validateField(key: string, value: string): string | null {
        const def = METADATA_KEYS.find((item) => ALLOWED_METADATA[item.allowedKey] === key);
        if (!def) return null;
        const schema = SCHEMAS[def.allowedKey];
        if (!schema) return null;
        const parsed = schema.safeParse(value);
        if (parsed.success) return null;
        return parsed.error.issues[0]?.message || 'Invalid value';
    }

    function hasSelectedEmptyFields(): boolean {
        return METADATA_FIELDS.some(({ key }) => {
            const field = metadata[key];
            return field?.selected && (!field.data || field.data.trim() === '');
        });
    }

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
            [key]: {
                ...prev[key],
                selected: !metadata[key]?.selected,
                data: !metadata[key]?.selected ? prev[key]?.data || '' : '',
            },
        }));
        if (metadata[key]?.selected) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    }

    const hasEmptyRequiredFields = hasSelectedEmptyFields();
    const hasValidationErrors = Object.values(validationErrors).some((error) => error);
    const isLoading = isUpdateNameLoading || isSigning || isSaving;
    const disableApply =
        isLoading ||
        updates.length === 0 ||
        !updateNameTransaction ||
        hasValidationErrors ||
        hasEmptyRequiredFields;

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
                <div className="flex flex-col gap-y-md gap-2 p-md--rs">
                    {updateNameError ? (
                        <InfoBox
                            type={InfoBoxType.Error}
                            style={InfoBoxStyle.Elevated}
                            icon={<Warning />}
                            title="Error"
                            supportingText={getUserFriendlyErrorMessage(updateNameError)}
                        />
                    ) : null}
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
                            onClick={() => handleApply()}
                            fullWidth
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
