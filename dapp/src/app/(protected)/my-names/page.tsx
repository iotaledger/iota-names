// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, Card, CardBody, CardType, Title, TitleSize } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { UpdateNameDialog } from '@/components/dialogs/UpdateNameDialog';
import { AvatarDisplay } from '@/components/name-record/AvatarDisplay';
import { UserAuctions } from '@/components/UserAuctions';
import { useRegistrationNfts } from '@/hooks';

export default function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);

    const { data: names } = useRegistrationNfts('name');
    const { data: subnames } = useRegistrationNfts('subname');

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

            <div className="flex flex-row gap-sm items-center justify-center flex-wrap w-full">
                {names?.map((nft) => (
                    <div key={nft.name}>
                        <Card type={CardType.Filled}>
                            <div className="flex flex-col items-center gap-y-sm">
                                <div className="w-40 h-40 object-cover">
                                    <AvatarDisplay registration={nft} />
                                </div>
                                <Title title={nft.name} size={TitleSize.Small} />
                                <Button
                                    text="Manage"
                                    onClick={() => setUpdateNameDialog(nft.name)}
                                />
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
            <div className="pt-md">
                <Title title="My subnames" />
            </div>
            {subnames?.length && (
                <div className="flex flex-col gap-y-sm items-center">
                    {subnames.map((subname) => (
                        <Card key={subname.name} type={CardType.Filled}>
                            <CardBody
                                title={subname.name}
                                subtitle={subname.name}
                                clickableAction={
                                    <Button
                                        text="Manage"
                                        onClick={() => {
                                            setUpdateNameDialog(subname.name);
                                        }}
                                    />
                                }
                            />
                        </Card>
                    ))}
                </div>
            )}
            <div className="pt-md w-full max-w-md">
                <UserAuctions />
            </div>
        </div>
    );
}
