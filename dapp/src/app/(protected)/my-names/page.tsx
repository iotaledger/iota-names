// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, KeyValueInfo, Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AddSubnameDialog, AvailabilityCheck } from '@/components';
import { useRegistrationNfts } from '@/hooks';

function MyNamesPage(): JSX.Element {
    const registrationNfts = useRegistrationNfts();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-x-sm items-center">
                {registrationNfts?.map((nameRecord) => (
                    <div
                        key={nameRecord.name}
                        className="flex flex-row gap-x-lg items-center w-full"
                    >
                        <KeyValueInfo
                            keyText={nameRecord.name}
                            value={nameRecord?.description ?? ''}
                            fullwidth
                        />
                        <Button
                            text="Add subname"
                            onClick={() => setIsDialogOpen(true)}
                            disabled={nameRecord.expiration_timestamp_ms < Date.now()}
                        />
                        {isDialogOpen && (
                            <AddSubnameDialog
                                nft={nameRecord}
                                open={isDialogOpen}
                                setOpen={setIsDialogOpen}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MyNamesPage;
