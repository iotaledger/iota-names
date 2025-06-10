// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, Checkbox, KeyValueInfo, Title } from '@iota/apps-ui-kit';
import { useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useEffect, useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { useRegistrationNfts } from '@/hooks';
import { useEditSetup } from '@/hooks/useEditSetup';

function MyNamesPage(): JSX.Element {
    type NameRecord = {
        id: string;
        name: string;
        description?: string;
        image_url?: string;
        link?: string;
        project_url?: string;
        expiration_timestamp_ms?: string;
        isAllowSubdomains: boolean;
        isAllowRenew: boolean;
    };

    const registrationNfts = useRegistrationNfts();
    const length = registrationNfts?.length ?? 0;
    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();
    const editNameRecord = useEditSetup();

    const [localNfts, setLocalNfts] = useState<NameRecord[]>([]);

    useEffect(() => {
        if (registrationNfts && registrationNfts.length > 0) {
            setLocalNfts(
                registrationNfts.map((nft) => ({
                    ...nft,
                })),
            );
        }
    }, [registrationNfts && length]);
    const handleCheckboxChange = (id: string, field: 'isAllowRenew' | 'isAllowSubdomains') => {
        setLocalNfts((prevState) =>
            prevState.map((record) =>
                record.id === id ? { ...record, [field]: !record[field] } : record,
            ),
        );
    };

    const handleSetPermissions = async (id: string) => {
        const record = localNfts.find((r) => r.id === id);
        if (!record) {
            return;
        }
        const result = await editNameRecord(
            record.id,
            record.name,
            record.isAllowSubdomains,
            record.isAllowRenew,
        );
        await signAndExecuteTransaction({
            transaction: result.transaction.transaction,
        });
    };

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-x-sm items-center">
                {localNfts.map((nameRecord) => (
                    <div key={nameRecord.id} className="flex flex-row gap-x-lg items-center w-full">
                        <KeyValueInfo
                            key={nameRecord.name}
                            keyText={nameRecord.name}
                            value={nameRecord?.description ?? ''}
                            fullwidth
                        />
                        <Checkbox
                            label="Allow Renew"
                            isChecked={nameRecord.isAllowRenew}
                            onCheckedChange={() =>
                                handleCheckboxChange(nameRecord.id, 'isAllowRenew')
                            }
                            isDisabled={isSendingTransaction}
                        />
                        <Checkbox
                            label="Allow Subdomains"
                            isChecked={nameRecord.isAllowSubdomains}
                            onCheckedChange={() =>
                                handleCheckboxChange(nameRecord.id, 'isAllowSubdomains')
                            }
                            isDisabled={isSendingTransaction}
                        />
                        <Button
                            text="Set Permissions"
                            onClick={() => handleSetPermissions(nameRecord.id)}
                            disabled={
                                Date.now() > (Number(nameRecord.expiration_timestamp_ms) || 0) ||
                                isSendingTransaction
                            }
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MyNamesPage;
