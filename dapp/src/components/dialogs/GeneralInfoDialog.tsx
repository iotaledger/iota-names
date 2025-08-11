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
    TitleSize,
    TooltipPosition,
} from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { isSubname } from '@iota/iota-names-sdk';
import { formatAddress } from '@iota/iota-sdk/utils';
import Link from 'next/link';

import { NameRecordData, useNameRecord, useRegistrationNfts } from '@/hooks';
import { formatDate } from '@/lib/utils/format/formatDate';

import { Collapsible } from '../Collapsible';
import { AvatarDisplay } from '../name-record/AvatarDisplay';
import { TruncatedNameWithTooltip } from '../TruncatedNameWithTooltip';

interface InfoLinks {
    key: string;
    value: string;
    href: string;
}

interface GeneralInfoDialogProps {
    name: string;
    setOpen: (bool: boolean) => void;
}

export function GeneralInfoDialog({ name, setOpen }: GeneralInfoDialogProps) {
    const account = useCurrentAccount();
    const address = account?.address || '';

    const { data: nameRecordData } = useNameRecord(name);
    const { data: subnames } = useRegistrationNfts('subname');

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;
    const targetAddress = nameRecord?.nameRecord.targetAddress;
    const isNameSubname = isSubname(name);
    const { id, expirationTimestampMs } =
        (isNameSubname
            ? subnames?.find((n) => n.name === name)
            : { id: nameRecord?.nameRecord.nftId, ...nameRecord?.nameRecord }) ?? {};

    const infoLinks: InfoLinks[] = [
        {
            key: 'Owner',
            value: address,
            href: `https://explorer.iota.org/address/${address}?network=devnet`,
        },
        targetAddress && {
            key: 'Target address',
            value: targetAddress,
            href: `https://explorer.iota.org/address/${targetAddress}?network=devnet`,
        },
        {
            key: 'Object ID',
            value: id,
            href: `https://explorer.iota.org/object/${id}?network=devnet`,
        },
    ].filter((item): item is InfoLinks => Boolean(item));

    function handleClose() {
        setOpen(false);
    }

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent isFixedPosition position={DialogPosition.Right}>
                <Header title="General Info" onClose={handleClose} />
                <DialogBody>
                    <div className="flex flex-col justify-center items-center gap-lg">
                        <AvatarDisplay name={name} />
                        <span className="text-headline-sm text-names-neutral-92 w-full text-center">
                            <TruncatedNameWithTooltip
                                name={name}
                                tooltipPosition={TooltipPosition.Bottom}
                            />
                        </span>
                    </div>
                    <div className="flex flex-col gap-md mt-lg">
                        <Collapsible title="Info" titleSize={TitleSize.Small}>
                            <div className="flex flex-col pb-xs px-md--rs">
                                {infoLinks.map(({ key, value, href }) => (
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
                                                {formatAddress(value)}
                                            </Link>
                                        }
                                        fullwidth
                                    />
                                ))}
                            </div>
                        </Collapsible>
                        <Collapsible title="Name Object Info" titleSize={TitleSize.Small}>
                            <div className="pb-xs px-md--rs">
                                <KeyValueInfo
                                    keyText="Expiration Time"
                                    value={formatDate(expirationTimestampMs)}
                                    fullwidth
                                />
                            </div>
                        </Collapsible>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
