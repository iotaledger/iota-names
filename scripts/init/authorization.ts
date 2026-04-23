// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { ALLOWED_METADATA } from '@iota/iota-names-sdk';
import { TransactionArgument, type Transaction } from '@iota/iota-sdk/transactions';

/**
 * A helper to authorize any app in the IotaNames object.
 */
export const authorize = ({
    txb,
    adminCap,
    iotaNamesObjectId,
    type,
    iotaNamesPackageId,
}: {
    txb: Transaction;
    adminCap: string;
    iotaNamesObjectId: string;
    type: string;
    iotaNamesPackageId: string;
}) => {
    txb.moveCall({
        target: `${iotaNamesPackageId}::iota_names::authorize`,
        arguments: [txb.object(adminCap), txb.object(iotaNamesObjectId)],
        typeArguments: [type],
    });
};

/**
 * A helper to deauthorize any app that has been authorized on the IotaNames object.
 */
export const deauthorize = ({
    txb,
    adminCap,
    iotaNamesObjectId,
    type,
    iotaNamesPackageId,
}: {
    txb: Transaction;
    adminCap: string;
    iotaNamesObjectId: string;
    type: string;
    iotaNamesPackageId: string;
}) => {
    txb.moveCall({
        target: `${iotaNamesPackageId}::iota_names::deauthorize`,
        arguments: [txb.object(adminCap), txb.object(iotaNamesObjectId)],
        typeArguments: [type],
    });
};

/**
 * A helper to call `setup` function for many apps that create a "registry" to hold state.
 */
export const setup = ({
    txb,
    adminCap,
    iotaNamesObjectId,
    target,
    args,
}: {
    txb: Transaction;
    adminCap: string;
    iotaNamesObjectId: string;
    target: `${string}::${string}`;
    args?: TransactionArgument[];
}) => {
    txb.moveCall({
        target: `${target}::setup`,
        arguments: [txb.object(iotaNamesObjectId), txb.object(adminCap), ...(args || [])],
    });
};

/**
 * Add a config to the IotaNames object.
 */
export const addConfig = ({
    txb,
    adminCap,
    iotaNamesObjectId,
    type,
    config,
    iotaNamesPackageId,
}: {
    txb: Transaction;
    adminCap: string;
    iotaNamesObjectId: string;
    iotaNamesPackageId: string;
    config: TransactionArgument;
    type: string;
}) => {
    txb.moveCall({
        target: `${iotaNamesPackageId}::iota_names::add_config`,
        arguments: [txb.object(adminCap), txb.object(iotaNamesObjectId), config],
        typeArguments: [type],
    });
};

/**
 * Remove a config from IotaNames object.
 */
export const removeConfig = ({
    txb,
    adminCap,
    iotaNamesObjectId,
    type,
    iotaNamesPackageId,
}: {
    txb: Transaction;
    adminCap: string;
    iotaNamesObjectId: string;
    iotaNamesPackageId: string;
    type: string;
}) => {
    txb.moveCall({
        target: `${iotaNamesPackageId}::iota_names::remove_config`,
        arguments: [txb.object(adminCap), txb.object(iotaNamesObjectId)],
        typeArguments: [type],
    });
};

export const newPriceConfig = ({
    txb,
    packageId,
    ranges,
    prices,
}: {
    txb: Transaction;
    packageId: string;
    ranges: number[][];
    prices: number[];
}): TransactionArgument => {
    var rangesList: TransactionArgument[] = [];
    for (const range of ranges) {
        if (range.length !== 2) {
            throw new Error('Each range must have exactly 2 elements');
        }
        rangesList.push(newRange({ txb, packageId, range }));
    }
    return txb.moveCall({
        target: `${packageId}::pricing_config::new`,
        arguments: [
            txb.makeMoveVec({ elements: rangesList, type: `${packageId}::pricing_config::Range` }),
            txb.pure.vector('u64', prices),
        ],
    });
};

export const addCoreConfig = ({
    txb,
    latestPackageId,
}: {
    txb: Transaction;
    latestPackageId: string;
}) => {
    return txb.moveCall({
        target: `${latestPackageId}::core_config::new`,
        arguments: [
            txb.pure.u8(3),
            txb.pure.u8(63),
            txb.pure.u8(1),
            txb.pure.u8(5),
            txb.pure.vector('string', ['iota']),
            txb.pure.vector('string', Object.values(ALLOWED_METADATA)),
            txb.moveCall({
                target: '0x2::vec_map::empty',
                typeArguments: ['0x1::string::String', '0x1::string::String'],
            }),
        ],
    });
};

export const newRenewalConfig = ({
    txb,
    packageId,
    ranges,
    prices,
}: {
    txb: Transaction;
    packageId: string;
    ranges: number[][];
    prices: number[];
}): TransactionArgument => {
    return txb.moveCall({
        target: `${packageId}::pricing_config::new_renewal_config`,
        arguments: [newPriceConfig({ txb, packageId, ranges, prices })],
    });
};

export const newRange = ({
    txb,
    packageId,
    range,
}: {
    txb: Transaction;
    packageId: string;
    range: number[];
}): TransactionArgument => {
    return txb.moveCall({
        target: `${packageId}::pricing_config::new_range`,
        arguments: [txb.pure.vector('u64', range)],
    });
};

export const newPaymentsConfig = ({
    txb,
    packageId,
    coinType,
    baseCurrencyType,
}: {
    txb: Transaction;
    packageId: string;
    coinType: Record<string, string>[];
    baseCurrencyType: string;
}): TransactionArgument => {
    const coinTypeDataList: TransactionArgument[] = [];

    for (const coin of coinType) {
        coinTypeDataList.push(
            newCoinTypeData({
                txb,
                packageId,
                coinType: coin['type'],
                coinMetadataId: coin['metadataId'],
            }),
        );
    }

    return txb.moveCall({
        target: `${packageId}::payments::new_payments_config`,
        arguments: [
            txb.makeMoveVec({
                elements: coinTypeDataList,
                type: `${packageId}::payments::CoinTypeData`,
            }),
            getTypeName({ txb, coinType: baseCurrencyType }),
        ],
    });
};

export const getTypeName = ({
    txb,
    coinType,
}: {
    txb: Transaction;
    coinType: string;
}): TransactionArgument => {
    return txb.moveCall({
        target: '0x1::type_name::get',
        typeArguments: [coinType],
    });
};

export const newCoinTypeData = ({
    txb,
    packageId,
    coinType,
    coinMetadataId,
}: {
    txb: Transaction;
    packageId: string;
    coinType: string;
    coinMetadataId: string;
}): TransactionArgument => {
    return txb.moveCall({
        target: `${packageId}::payments::new_coin_type_data`,
        arguments: [txb.object(coinMetadataId)],
        typeArguments: [coinType],
    });
};

/**
 * Add a registry to the IotaNames object.
 */
export const addRegistry = ({
    txb,
    adminCap,
    iotaNamesObjectId,
    type,
    registry,
    iotaNamesPackageId,
}: {
    txb: Transaction;
    adminCap: string;
    iotaNamesObjectId: string;
    iotaNamesPackageId: string;
    registry: TransactionArgument;
    type: string;
}) => {
    txb.moveCall({
        target: `${iotaNamesPackageId}::iota_names::add_registry`,
        arguments: [txb.object(adminCap), txb.object(iotaNamesObjectId), registry],
        typeArguments: [type],
    });
};

/**
 * Creates a default `registry` which saves direct/reverse lookups.
 * That serves as the main registry for the IotaNames object after adding it.
 */
export const newLookupRegistry = ({
    txb,
    adminCap,
    iotaNamesPackageId,
}: {
    txb: Transaction;
    adminCap: string;
    iotaNamesPackageId: string;
}): TransactionArgument => {
    return txb.moveCall({
        target: `${iotaNamesPackageId}::registry::new`,
        arguments: [txb.object(adminCap)],
    });
};
