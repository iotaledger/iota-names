// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Title } from '@iota/apps-ui-kit';

import { AvailabilityCheck } from '@/components';

function MyNamesPage(): JSX.Element {
    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
        </div>
    );
}

export default MyNamesPage;
