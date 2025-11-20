// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Test registering a name, used in the typescript.yaml workflow to test the published packages.

import { IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IOTA_TYPE_ARG } from '@iota/iota-sdk/utils';

import { PackageInfo, readPackageInfo } from '../package-info/constants';
import { getClient, getSigner, signAndExecute } from '../utils/utils';

const registerName = async () => {
    const name = 'test.iota';

    const network = process.env.NETWORK;
    if (!network) {
        throw new Error(
            'Network not defined. Please run `export NETWORK=mainnet|testnet|devnet|localnet`',
        );
    }
    const packageInfo = readPackageInfo(network);

    const client = getClient(network);
    const price = await getPrice(client, packageInfo, name);
    console.log(`Price for ${name} is ${price}`);

    let tx = new Transaction();
    const paymentIntent = tx.moveCall({
        target: `${packageInfo.packageId.v1}::payment::init_registration`,
        arguments: [tx.object(packageInfo.iotaNamesObjectId), tx.pure.string(name)],
    });

    const payment = tx.splitCoins(tx.gas, [price]);
    const receipt = tx.moveCall({
        target: `${packageInfo.paymentsPackageId.v1}::payments::handle_base_payment`,
        arguments: [tx.object(packageInfo.iotaNamesObjectId), paymentIntent, payment],
        typeArguments: [IOTA_TYPE_ARG],
    });
    const nft = tx.moveCall({
        target: `${packageInfo.packageId.v1}::payment::register`,
        arguments: [receipt, tx.object(packageInfo.iotaNamesObjectId), tx.object('0x6')],
    });
    const signer = getSigner();
    tx.transferObjects([nft], tx.pure.address(signer.getPublicKey().toIotaAddress()));

    const res = await signAndExecute(tx, network);
    if (res.errors) {
        console.error('Transaction failed:', res.errors);
        throw new Error(JSON.stringify(res.errors));
    } else {
        console.log('Transaction result:', res);
    }
};
registerName();

async function getPrice(client: IotaClient, packageInfo: PackageInfo, name: string) {
    const allFields = await client.getDynamicFields({
        parentId: packageInfo.iotaNamesObjectId,
    });
    let pricingConfigId = '';
    for (const field of allFields.data) {
        if (field.objectType === `${packageInfo.packageId.v1}::pricing_config::PricingConfig`) {
            pricingConfigId = field.objectId;
            break;
        }
    }
    const priceList = await client.getObject({
        id: pricingConfigId,
        options: { showContent: true },
    });
    if (
        !priceList?.data?.content ||
        priceList.data.content.dataType !== 'moveObject' ||
        !('fields' in priceList.data.content)
    ) {
        throw new Error('Price list not found or content is invalid');
    }
    // Safely extract fields
    const fields = priceList.data.content.fields as Record<string, any>;
    if (!fields.value || !fields.value.fields || !fields.value.fields.pricing) {
        throw new Error('Pricing fields not found in the price list');
    }

    const contentArray = fields.value.fields.pricing.fields.contents;
    const priceMap = new Map();
    for (const entry of contentArray) {
        const keyFields = entry.fields.key.fields;
        const key = [Number(keyFields.pos0), Number(keyFields.pos1)]; // Convert keys to numbers
        const value = Number(entry.fields.value); // Convert value to a number

        priceMap.set(key, value);
    }

    return mapValue(priceMap, name.split('.')[0].length);
}

function mapValue(map: Map<number[], number>, value: number) {
    for (const [range, mappedValue] of map) {
        const [start, end] = range;
        if (value >= start && value <= end) {
            return mappedValue;
        }
    }
    throw new Error('no price entry for length: ' + value);
}
