// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, Card, CardBody, CardType, Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { UpdateNameDialog } from '@/components/dialogs/UpdateNameDialog';
import { useRegistrationNfts, useSubdomainRegistrations } from '@/hooks';

function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);
    const registrationNfts = useRegistrationNfts();
    const subdomainRegistrations = useSubdomainRegistrations();

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            {updateNameDialog ? (
                <UpdateNameDialog
                    name={updateNameDialog}
                    open
                    setOpen={() => setUpdateNameDialog(null)}
                />
            ) : null}
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-y-sm items-center">
                {registrationNfts.map((nft) => (
                    <Card key={nft.name} type={CardType.Filled}>
                        <CardBody
                            title={nft.name}
                            subtitle={nft.name}
                            clickableAction={
                                <Button
                                    text="Manage"
                                    onClick={() => setUpdateNameDialog(nft.name)}
                                />
                            }
                        />
                    </Card>
                ))}
            </div>

            {subdomainRegistrations ? (
                <>
                    <div className="pt-md">
                        <Title title="My subdomains" testId="my-names-page" />
                    </div>
                    <div className="flex flex-col gap-x-sm items-center">
                        {subdomainRegistrations?.map((nameRecord) => (
                            <Card key={nameRecord.name} type={CardType.Filled}>
                                <CardBody
                                    title={nameRecord.name}
                                    subtitle={nameRecord.name}
                                    clickableAction={
                                        <Button
                                            text="Manage"
                                            onClick={() => setUpdateNameDialog(nameRecord.name)}
                                        />
                                    }
                                />
                            </Card>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}

export default MyNamesPage;
