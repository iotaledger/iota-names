// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { KeyValueInfo, Title } from '@iota/apps-ui-kit';

import { AvailabilityCheck } from '@/components';
import { useRegistrationNfts, useSubdomainRegistrations } from '@/hooks';

function MyNamesPage(): JSX.Element {
    const registrationNfts = useRegistrationNfts();
    const subdomainRegistrations = useSubdomainRegistrations();

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-x-sm items-center">
                {registrationNfts?.map((nameRecord) => (
                    <KeyValueInfo
                        key={nameRecord.name}
                        keyText={nameRecord.name}
                        value={nameRecord?.description ?? ''}
                        fullwidth
                    />
                ))}
            </div>

            {subdomainRegistrations ? (
                <>
                    <div className="pt-md">
                        <Title title="My subdomains" testId="my-names-page" />
                    </div>
                    <div className="flex flex-col gap-x-sm items-center">
                        {subdomainRegistrations?.map((nameRecord) => (
                            <KeyValueInfo
                                key={nameRecord.name}
                                keyText={nameRecord.name}
                                value={nameRecord?.description ?? ''}
                                fullwidth
                            />
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}

export default MyNamesPage;
