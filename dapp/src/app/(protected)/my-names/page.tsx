// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType, Card, CardType, Title, TitleSize } from '@iota/apps-ui-kit';
import { useMemo, useState } from 'react';

import { UserAuctions } from '@/auctions/components/UserAuctions';
import { AvailabilityCheck, DeleteNameDialog, UpdateNameDialog } from '@/components';
import { AvatarDisplay } from '@/components/name-record/AvatarDisplay';
import { useRegistrationNfts } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

export default function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);
    const [deleteNameDialog, setDeleteNameDialog] = useState<RegistrationNft | null>(null);

    const { data: names } = useRegistrationNfts('name');
    const { data: subnames } = useRegistrationNfts('subname');

    const namesWithChildren = useMemo(() => {
        const parents = new Set<string>();

        [...(names ?? []), ...(subnames ?? [])].forEach(({ name }) => {
            const firstDot = name.indexOf('.');
            if (firstDot !== -1) {
                const parentName = name.slice(firstDot + 1);
                parents.add(parentName);
            }
        });

        return parents;
    }, [names, subnames]);

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
            <div className="flex flex-row gap-sm items-center justify-center flex-wrap w-full">
                {names?.map((nft) => {
                    const isNftDeletable = nft.isExpired && !namesWithChildren.has(nft.name);
                    return (
                        <div key={nft.name}>
                            <Card type={CardType.Filled}>
                                <div className="flex flex-col items-center gap-y-sm">
                                    <div className="w-40 h-40 object-cover">
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
                        </div>
                    );
                })}
            </div>
            <div className="pt-md">
                <Title title="My subnames" />
            </div>
            <div className="flex flex-row gap-sm items-center justify-center flex-wrap w-full">
                {subnames?.map((subname) => {
                    const isSubnameRemovable =
                        subname.isExpired && !namesWithChildren.has(subname.name);
                    return (
                        <div key={subname.name}>
                            <Card key={subname.name} type={CardType.Filled}>
                                <div className="flex flex-col items-center gap-y-sm">
                                    <div className="w-40 h-40 object-cover">
                                        <AvatarDisplay registration={subname} />
                                    </div>
                                    <Title
                                        title={subname.name}
                                        size={TitleSize.Small}
                                        subtitle={`Expiration Date: ${
                                            subname?.expirationTimestampMs
                                                ? new Date(
                                                      subname.expirationTimestampMs,
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
                                            onClick={() => setUpdateNameDialog(subname.name)}
                                        />
                                        {isSubnameRemovable ? (
                                            <Button
                                                text="Delete"
                                                type={ButtonType.Destructive}
                                                onClick={() => setDeleteNameDialog(subname)}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>
            <div className="pt-md w-full">
                <UserAuctions />
            </div>
        </div>
    );
}
