// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { IotaObjectResponse } from '@iota/iota-sdk/client';

import { readPackageInfo } from '../package-info/constants';
import { getClient } from '../utils/utils';

export const fetchOwnedNames = async () => {
    const network = process.env.NETWORK;
    if (!network) {
        throw new Error(
            'Network not defined. Please run `export NETWORK=mainnet|testnet|devnet|localnet`',
        );
    }
    const packageInfo = readPackageInfo(network);
    let client = getClient(network);
    let hasNextPage = true;
    let cursor: string | null | undefined = undefined;

    let names: IotaObjectResponse[] = [];

    while (hasNextPage) {
        const res = await client.getOwnedObjects({
            owner: packageInfo.adminAddress,
            filter: {
                MatchAll: [
                    {
                        StructType: `${packageInfo.packageId.v1}::name_registration::NameRegistration`,
                    },
                ],
            },
            options: {
                showContent: true,
                showType: true,
            },
            cursor,
        });
        names.push(...res.data);
        hasNextPage = res.hasNextPage;
        cursor = res.nextCursor;

        console.log('Total names after batch: ' + names.length);
    }

    // Save to file.
    fs.writeFileSync('./reserved-names/owned-names.json', JSON.stringify(names));
};
