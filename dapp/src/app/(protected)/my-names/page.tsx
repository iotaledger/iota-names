// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, Card, CardBody, CardType, Title } from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClientContext } from '@iota/dapp-kit';
import { getIotaNamesRegistrationType, mainPackage } from '@iota/iota-names-sdk';
import { useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { UpdateNameDialog } from '@/components/dialogs/UpdateNameDialog';
import { useGetAllOwnedObjects } from '@/hooks/useGetAllOwnedObjects';

function MyNamesPage(): JSX.Element {
    const account = useCurrentAccount();
    const address = account?.address ?? '';
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);

    const { network: networkName } = useIotaClientContext();
    const config = mainPackage[networkName as keyof typeof mainPackage];

    const { data: namesRegistrationData } = useGetAllOwnedObjects(address, {
        StructType: getIotaNamesRegistrationType(config.packageId),
    });

    console.log('namesRegistrationData Objects:', namesRegistrationData);
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
                {namesRegistrationData?.map((nameRecord) => {
                    const name = nameRecord.display?.data?.name;

                    if (!name) {
                        return null;
                    }

                    return (
                        <Card key={name} type={CardType.Filled}>
                            <CardBody
                                title={name}
                                subtitle={name}
                                clickableAction={
                                    <Button
                                        text="Manage"
                                        onClick={() => setUpdateNameDialog(name)}
                                    />
                                }
                            />
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default MyNamesPage;
