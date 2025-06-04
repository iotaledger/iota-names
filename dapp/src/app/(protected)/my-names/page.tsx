// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { KeyValueInfo, Title } from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClientContext } from '@iota/dapp-kit';
import { getIotaNamesRegistrationType, mainPackage } from '@iota/iota-names-sdk';

import { AvailabilityCheck } from '@/components';
import { useGetAllOwnedObjects } from '@/hooks/useGetAllOwnedObjects';

function MyNamesPage(): JSX.Element {
    const account = useCurrentAccount();
    const address = account?.address ?? '';

    const { network: networkName } = useIotaClientContext();
    const config = mainPackage[networkName as keyof typeof mainPackage];

    const { data: namesRegistrationData } = useGetAllOwnedObjects(address, {
        StructType: getIotaNamesRegistrationType(config.packageId),
    });

    console.log('namesRegistrationData Objects:', namesRegistrationData);
    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-x-sm items-center">
                {namesRegistrationData?.map((nameRecord) => (
                    <KeyValueInfo
                        keyText={nameRecord?.display?.data?.name ?? ''}
                        value={nameRecord?.display?.data?.description ?? ''}
                        fullwidth
                    />
                ))}
            </div>
        </div>
    );
}

export default MyNamesPage;
