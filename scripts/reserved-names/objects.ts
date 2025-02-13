// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { IotaObjectResponse } from '@iota/iota-sdk/client';

import { mainPackage } from '../config/constants';
import { getClient } from '../utils/utils';

const config = mainPackage.mainnet;

const getAllOwnedDomains = async () => {
	let client = getClient('mainnet');
	let hasNextPage = true;
	let cursor: string | null | undefined = undefined;

	let names: IotaObjectResponse[] = [];

	while (hasNextPage) {
		const res = await client.getOwnedObjects({
			owner: config.adminAddress,
			filter: {
				MatchAll: [
					{
						StructType: `0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::iota_names_registration::IotaNamesRegistration`,
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
	fs.writeFileSync('./owned-objects.json', JSON.stringify(names));
};

getAllOwnedDomains();
