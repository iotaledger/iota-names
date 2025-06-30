// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType, Card, CardType, Title, TitleSize } from '@iota/apps-ui-kit';
import { useMemo, useState } from 'react';

import { AvailabilityCheck, DeleteNameDialog, UpdateNameDialog } from '@/components';
import { AvatarDisplay } from '@/components/name-record/AvatarDisplay';
import { useRegistrationNfts } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

export default function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);
    const [deleteNameDialog, setDeleteNameDialog] = useState<RegistrationNft | null>(null);

    const { data: domains } = useRegistrationNfts('domain');
    const { data: subdomains } = useRegistrationNfts('subdomain');

    const namesWithChildren = useMemo(() => {
        const parents = new Set<string>();

        [...(domains ?? []), ...(subdomains ?? [])].forEach(({ name }) => {
            const firstDot = name.indexOf('.');
            if (firstDot !== -1) {
                const parentName = name.slice(firstDot + 1);
                parents.add(parentName);
            }
        });

        return parents;
    }, [domains, subdomains]);

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
            {deleteNameDialog ? (
                <DeleteNameDialog
                    nft={deleteNameDialog}
                    open
                    setOpen={() => setDeleteNameDialog(null)}
                />
            ) : null}
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-y-sm items-center w-1/2">
                {domains?.map((nft) => {
                    const isNftDeletable = nft.isExpired && !namesWithChildren.has(nft.name);
                    return (
                        <Card key={nft.name} type={CardType.Filled}>
                            <div className="flex flex-col  gap-y-sm w-full">
                                <div className="w-full h-40 object-cover">
                                    <AvatarDisplay registration={nft} />
                                </div>
                                <Title
                                    title={nft.name}
                                    size={TitleSize.Small}
                                    subtitle={`Expiration Date: ${
                                        nft?.expirationTimestampMs
                                            ? new Date(
                                                  nft.expirationTimestampMs,
                                              ).toLocaleDateString('en-US', {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: 'numeric',
                                              })
                                            : '--'
                                    }`}
                                />
                                <div className="flex flex-row gap-x-xs">
                                    <Button
                                        text="Manage"
                                        fullWidth
                                        onClick={() => setUpdateNameDialog(nft.name)}
                                    />
                                    {isNftDeletable ? (
                                        <Button
                                            text="Delete"
                                            type={ButtonType.Destructive}
                                            onClick={() => setDeleteNameDialog(nft)}
                                        />
                                    ) : null}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
            <div className="pt-md">
                <Title title="My subnames" />
            </div>
            {subdomains?.length && (
                <div className="flex flex-col gap-y-sm items-center w-1/2">
                    {subdomains.map((subdomain) => {
                        const isSubdomainRemovable =
                            subdomain.isExpired && !namesWithChildren.has(subdomain.name);
                        return (
                            <Card key={subdomain.name} type={CardType.Filled}>
                                <div className="flex flex-col  gap-y-sm w-full">
                                    <div className="w-full h-40 object-cover">
                                        <AvatarDisplay registration={subdomain} />
                                    </div>
                                    <Title
                                        title={subdomain.name}
                                        size={TitleSize.Small}
                                        subtitle={`Expiration Date: ${
                                            subdomain?.expirationTimestampMs
                                                ? new Date(
                                                      subdomain.expirationTimestampMs,
                                                  ).toLocaleDateString('en-US', {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric',
                                                  })
                                                : '--'
                                        }`}
                                    />
                                    <div className="flex flex-row gap-x-xs">
                                        <Button
                                            text="Manage"
                                            fullWidth
                                            onClick={() => setUpdateNameDialog(subdomain.name)}
                                        />
                                        {isSubdomainRemovable ? (
                                            <Button
                                                text="Delete"
                                                type={ButtonType.Destructive}
                                                onClick={() => setDeleteNameDialog(subdomain)}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
