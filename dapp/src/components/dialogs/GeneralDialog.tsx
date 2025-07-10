// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Accordion,
    AccordionContent,
    AccordionHeader,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
    KeyValueInfo,
    Title,
    truncate,
} from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import Link from 'next/link';
import { useState } from 'react';

import { useNameRecord, useRegistrationNfts } from '@/hooks';
import { normalizeNameInput } from '@/lib/utils/format/formatNames';

import { AvatarDisplay } from '../name-record/AvatarDisplay';

type UpdateNameDialogProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function GeneralInfoDialog({ name, open, setOpen }: UpdateNameDialogProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const onToggle = () => {
        setIsExpanded(!isExpanded);
    };
    const account = useCurrentAccount();
    const address = account?.address || '';
    const { data: names } = useRegistrationNfts('name');
    const currentName = names?.find((n) => n.name === name);
    const currentNameId = currentName?.id ?? '';

    const expiration = currentName?.expirationTimestampMs;
    const expirationDate = expiration
        ? new Date(expiration).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '—';

    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);
    const targetAddress =
        nameRecordData?.type === 'unavailable'
            ? nameRecordData.nameRecord.targetAddress
            : undefined;

    console.log('targetAddress', targetAddress);

    if (isNameRecordLoading || !nameRecordData) return null;
    function handleClose() {
        setOpen(false);
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    containerId="overlay-portal-container"
                    isFixedPosition
                    position={DialogPosition.Right}
                >
                    <Header title="General Info" onClose={handleClose} />
                    <DialogBody>
                        <div className="flex flex-col justify-center items-center gap-lg">
                            <AvatarDisplay name={name} />
                            <span className="text-headline-sm text-names-neutral-92">
                                @{normalizeNameInput(name)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-md mt-lg">
                            <Accordion hideBorder={false}>
                                <AccordionHeader isExpanded={isExpanded} onToggle={onToggle}>
                                    <Title title="Info" />
                                </AccordionHeader>
                                <AccordionContent isExpanded={isExpanded}>
                                    <div className="flex flex-col py-xs px-md--rs ">
                                        <KeyValueInfo
                                            isTruncated
                                            keyText="Owner"
                                            value={
                                                <Link
                                                    href={`https://explorer.iota.org/address/${address}`}
                                                    className="text-names-primary-80 text-body-md select-none"
                                                >
                                                    {truncate(address)}
                                                </Link>
                                            }
                                            fullwidth
                                        />
                                        {targetAddress && (
                                            <KeyValueInfo
                                                keyText="Target address"
                                                value={
                                                    <Link
                                                        href={`https://explorer.iota.org/address/${targetAddress}`}
                                                        className="text-names-primary-80 text-body-md"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {truncate(targetAddress)}
                                                    </Link>
                                                }
                                                fullwidth
                                            />
                                        )}

                                        <KeyValueInfo
                                            keyText="Object ID"
                                            value={
                                                <Link
                                                    href={`https://explorer.iota.org/address/${currentNameId}`}
                                                    className="text-names-primary-80 text-body-md"
                                                >
                                                    {truncate(currentNameId)}
                                                </Link>
                                            }
                                            fullwidth
                                        />
                                    </div>
                                </AccordionContent>
                            </Accordion>
                            <Accordion hideBorder={false}>
                                <AccordionHeader isExpanded={isExpanded} onToggle={onToggle}>
                                    <Title title="Name Object Info" />
                                </AccordionHeader>
                                <AccordionContent isExpanded={isExpanded}>
                                    <div className="py-xs px-md--rs ">
                                        <KeyValueInfo
                                            keyText="Expiration Time"
                                            value={expirationDate}
                                            fullwidth
                                        />
                                    </div>
                                </AccordionContent>
                            </Accordion>
                        </div>
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </>
    );
}
