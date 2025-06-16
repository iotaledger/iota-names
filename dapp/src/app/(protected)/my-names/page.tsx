// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, Card, CardBody, CardType, Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { UpdateNameDialog } from '@/components/dialogs/UpdateNameDialog';
import { useRegistrationNfts } from '@/hooks';

function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);
    const { data: domains } = useRegistrationNfts('domain');
    const { data: subdomains } = useRegistrationNfts('subdomain');

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
                {' '}
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
                <div className="flex flex-col gap-y-sm items-center">
                    {' '}
                    {subdomains.map((subdomain) => (
                        <Card key={subdomain.name} type={CardType.Filled}>
                            <CardBody
                                title={subdomain.name}
                                subtitle={subdomain.name}
                                clickableAction={
                                    <Button
                                        text="Manage"
                                        onClick={() => setUpdateNameDialog(subdomain.name)}
                                    />
                                }
                            />
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyNamesPage;
