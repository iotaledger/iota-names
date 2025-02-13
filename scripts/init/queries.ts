// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaClient } from '@iota/iota-sdk/client';

export const queryRegistryTable = async (
	client: IotaClient,
	iotaNames: string,
	iotaNamesPackageId: string,
) => {
	const allFields = await client.getDynamicFields({
		parentId: iotaNames,
	});

	// just for testing..
	console.log(allFields);
	const table = await client.getDynamicFieldObject({
		parentId: iotaNames,
		name: {
			type: `${iotaNamesPackageId}::iota_names::RegistryKey<${iotaNamesPackageId}::registry::Registry>`,
			value: {
				dummy_field: false,
			},
		},
	});

	console.log(table);
	console.log(iotaNames);

	if (table.data?.content?.dataType !== 'moveObject')
		throw new Error(`Invalid data ${iotaNamesPackageId}`);

	const data = table.data?.content.fields as Record<string, any>;
	return data.value.fields.registry.fields.id.id;
};
