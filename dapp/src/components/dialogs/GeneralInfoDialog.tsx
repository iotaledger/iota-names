// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
    KeyValueInfo,
    truncate,
} from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import Link from 'next/link';

import { useNameRecord, useRegistrationNfts } from '@/hooks';
import { formatDate } from '@/lib/utils/format/formatDate';
import { normalizeNameInput } from '@/lib/utils/format/formatNames';

import { CollapsibleInfo } from '../CollapsibleInfo';
import { AvatarDisplay } from '../name-record/AvatarDisplay';

type UpdateNameDialogProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function GeneralInfoDialog({ name, open, setOpen }: UpdateNameDialogProps) {
    const account = useCurrentAccount();
    const address = account?.address || '';

    const { data: names } = useRegistrationNfts('name');
    const { data: subnames } = useRegistrationNfts('subname');

    const isSubname = !names?.find((n) => n.name === name);
    const currentName = isSubname
        ? subnames?.find((n) => n.name === name)
        : names?.find((n) => n.name === name);

    const currentNameId = currentName?.id ?? '';
    const expirationTime = currentName?.expirationTimestampMs;

    const { data: nameRecordData } = useNameRecord(name);
    const targetAddress =
        nameRecordData?.type === 'unavailable'
            ? nameRecordData.nameRecord.targetAddress
            : undefined;

    const handleClose = () => setOpen(false);
    type InfoLinks = { key: string; value: string; href: string };
    const InfoLinks: InfoLinks[] = [
        {
            key: 'Owner',
            value: address,
            href: `https://explorer.iota.org/address/${address}`,
        },
        targetAddress && {
            key: 'Target address',
            value: targetAddress,
            href: `https://explorer.iota.org/address/${targetAddress}`,
        },
        {
            key: 'Object ID',
            value: currentNameId,
            href: `https://explorer.iota.org/address/${currentNameId}`,
        },
    ].filter((item): item is InfoLinks => Boolean(item));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent isFixedPosition position={DialogPosition.Right}>
                <Header title="General Info" onClose={handleClose} />
                <DialogBody>
                    <div className="flex flex-col justify-center items-center gap-lg">
                        <AvatarDisplay name={name} />
                        <span className="text-headline-sm text-names-neutral-92">
                            @{normalizeNameInput(name)}
                        </span>
                    </div>

                    <div className="flex flex-col gap-md mt-lg">
                        <CollapsibleInfo title="Info">
                            <div className="flex flex-col py-xs px-md--rs">
                                {InfoLinks.map(({ key, value, href }) => (
                                    <KeyValueInfo
                                        key={key}
                                        isTruncated
                                        keyText={key}
                                        value={
                                            <Link
                                                href={href}
                                                className="text-names-primary-80 text-body-md"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {truncate(value)}
                                            </Link>
                                        }
                                        fullwidth
                                    />
                                ))}
                            </div>
                        </CollapsibleInfo>
                        <CollapsibleInfo title="Name Object Info">
                            <div className="py-xs px-md--rs">
                                <KeyValueInfo
                                    keyText="Expiration Time"
                                    value={formatDate(expirationTime)}
                                    fullwidth
                                />
                            </div>
                        </CollapsibleInfo>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
