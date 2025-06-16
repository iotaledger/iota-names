// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, Card, CardBody, CardType, KeyValueInfo, Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { UpdateNameDialog } from '@/components/dialogs/UpdateNameDialog';
import { useRegistrationNfts } from '@/hooks';

function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);
<<<<<<< tooling/centralize-query-keys -- Incoming Change

    const { data: registrationNfts } = useRegistrationNfts();
=======
    const domains = useRegistrationNfts('domain');
    const subdomains = useRegistrationNfts('subdomain');
>>>>>>> develop -- Current Change

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
                {domains?.map((nft) => (
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
            <div className="pt-md">
                <Title title="My subnames" />
            </div>
            {subdomains?.length && (
                <div className="flex flex-col gap-x-sm items-center pl-4">
                    {subdomains.map((subdomain) => (
                        <KeyValueInfo
                            key={subdomain.name}
                            keyText={subdomain.name}
                            value={subdomain?.description ?? ''}
                            fullwidth
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyNamesPage;
