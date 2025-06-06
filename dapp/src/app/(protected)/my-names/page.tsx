// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { KeyValueInfo, Title } from '@iota/apps-ui-kit';

import { AvailabilityCheck } from '@/components';
import { useRegistrationNfts } from '@/hooks';

function MyNamesPage(): JSX.Element {
    const { data, fetchNextPage, hasNextPage } = useRegistrationNfts();

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-x-sm items-center">
                {data &&
                    data.pages.map((page) =>
                        page.data.map((nameRecord) => (
                            <KeyValueInfo
                                key={nameRecord.name}
                                keyText={nameRecord.name}
                                value={nameRecord.description ?? ''}
                                fullwidth
                            />
                        )),
                    )}
                {hasNextPage && <button onClick={() => fetchNextPage()}>Load More</button>}
            </div>
        </div>
    );
}

export default MyNamesPage;
