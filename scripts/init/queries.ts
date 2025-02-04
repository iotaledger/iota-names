// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaClient } from '@iota/iota-sdk/client';

export const queryRegistryTable = async (
	client: IotaClient,
	iotans: string,
	iotansPackageId: string,
) => {
	const allFields = await client.getDynamicFields({
		parentId: iotans,
	});

	// just for testing..
	console.log(allFields);
	const table = await client.getDynamicFieldObject({
		parentId: iotans,
		name: {
			type: `${iotansPackageId}::iotans::RegistryKey<${iotansPackageId}::registry::Registry>`,
			value: {
				dummy_field: false,
			},
		},
	});

	console.log(table);
	console.log(iotans);

	if (table.data?.content?.dataType !== 'moveObject')
		throw new Error(`Invalid data ${iotansPackageId}`);

	const data = table.data?.content.fields as Record<string, any>;
	return data.value.fields.registry.fields.id.id;
};
