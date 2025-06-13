// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { KeyValueInfo, Title } from '@iota/apps-ui-kit';
import {
    getIotaNamesRegistrationType,
    getIotaSubdomainRegistrationType,
} from '@iota/iota-names-sdk';

import { AvailabilityCheck } from '@/components';
import { useRegistrationNfts } from '@/hooks';
import { useIotaNamesClient } from '@/providers/contexts';

function MyNamesPage(): JSX.Element {
    const { iotaNamesClient } = useIotaNamesClient();
    const packageId = iotaNamesClient.config.packageId;

    const registrationNfts = useRegistrationNfts({
        StructType: getIotaNamesRegistrationType(packageId),
    });
    const subdomains = useRegistrationNfts({
        StructType: getIotaSubdomainRegistrationType(packageId),
    });

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-x-sm items-center">
                {registrationNfts?.map((nameRecord) => (
                    <>
                        <KeyValueInfo
                            key={nameRecord.name}
                            keyText={nameRecord.name}
                            value={nameRecord?.description ?? ''}
                            fullwidth
                        />
                    </>
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
