// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaClient } from '@iota/iota-sdk/client';

export const queryRegistryTables = async (
    client: IotaClient,
    iotaNames: string,
    iotaNamesPackageId: string,
) => {
    const table = await client.getDynamicFieldObject({
        parentObjectId: iotaNames,
        name: {
            type: `${iotaNamesPackageId}::iota_names::RegistryKey<${iotaNamesPackageId}::registry::Registry>`,
            value: {
                dummy_field: false,
            },
        },
        options: {
            showContent: true,
        },
    });

    if (table.data?.content?.dataType !== 'moveObject') {
        throw new Error(
            `Invalid data. Data type was expected to be 'moveObject' but was ${table.data?.content?.dataType} for package: ${iotaNamesPackageId}`,
        );
    }

    const data = table.data?.content.fields as Record<string, any>;
    let registryTableId = data.value.fields.registry.fields.id.id;
    let reverseRegistryTableId = data.value.fields.reverse_registry.fields.id.id;
    return { registryTableId, reverseRegistryTableId };
};
