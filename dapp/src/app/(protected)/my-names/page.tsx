// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { KeyValueInfo, Title } from '@iota/apps-ui-kit';
import {
    getIotaNamesRegistrationType,
    getIotaSubdomainRegistrationType,
} from '@iota/iota-names-sdk';

import { AvailabilityCheck } from '@/components';
import { RegistrationNft, useRegistrationNfts } from '@/hooks';
import { useIotaNamesClient } from '@/providers/contexts';

function MyNamesPage(): JSX.Element {
    const { iotaNamesClient } = useIotaNamesClient();
    const packageId = iotaNamesClient.config.packageId;

    const registrationNfts = useRegistrationNfts({
        StructType: getIotaNamesRegistrationType(packageId),
    });
    const subdomainsList = useRegistrationNfts({
        StructType: getIotaSubdomainRegistrationType(packageId),
    });

    const subdomainsMap: { [k: string]: RegistrationNft[] } = (() => {
        const map: { [k: string]: RegistrationNft[] } = {};
        subdomainsList?.forEach((subdomain) => {
            const parentName = subdomain.name.split('.').slice(1).join('.');
            if (!map[parentName]) {
                map[parentName] = [];
            }
            map[parentName].push(subdomain);
        });
        return map;
    })();

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
                        {subdomainsMap[nameRecord.name]?.length && (
                            <div className="flex flex-col gap-x-sm items-center pl-4">
                                {subdomainsMap[nameRecord.name].map((subdomain) => (
                                    <KeyValueInfo
                                        key={subdomain.name}
                                        keyText={subdomain.name}
                                        value={subdomain?.description ?? ''}
                                        fullwidth
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ))}
            </div>
        </div>
    );
}

export default MyNamesPage;
