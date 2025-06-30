// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

export const getImageUrl = (isSubname: boolean, network: string) => {
    const name = `{${isSubname ? 'nft.' : ''}name}`;
    const expiration = `{${isSubname ? 'nft.' : ''}expiration_timestamp_ms}`;

    return `https://api-${network}.iota-names.io/nfts/${name}/${expiration}`;
};

/** Creates the display. Should be called for both subnames and names. */
export const createDisplay = ({
    txb,
    publisher,
    isSubname,
    iotaNamesPackageId,
    subnamesPackageId,
    network = 'mainnet',
}: {
    txb: Transaction;
    publisher: string;
    isSubname: boolean;
    iotaNamesPackageId: string;
    subnamesPackageId: string;
    network: string;
}) => {
    const subnameRegistration = `${subnamesPackageId}::subname_registration::SubnameRegistration`;
    const iotaNamesRegistration = `${iotaNamesPackageId}::iota_names_registration::IotaNamesRegistration`;

    const display = txb.moveCall({
        target: `0x2::display::new`,
        arguments: [txb.object(publisher)],
        typeArguments: [isSubname ? subnameRegistration : iotaNamesRegistration],
    });

    txb.moveCall({
        target: `0x2::display::add_multiple`,
        arguments: [
            display,
            txb.pure.vector('string', ['name', 'link', 'image_url', 'description', 'project_url']),
            txb.pure.vector('string', [
                `{${isSubname ? 'nft.' : ''}name}`,
                `https://{${isSubname ? 'nft.' : ''}name}.id`,
                getImageUrl(isSubname, network),
                'IOTA-Names - Sculpt Your Identity',
                'https://iota-names.io',
            ]),
        ],
        typeArguments: [isSubname ? subnameRegistration : iotaNamesRegistration],
    });

    txb.moveCall({
        target: `0x2::display::update_version`,
        arguments: [display],
        typeArguments: [isSubname ? subnameRegistration : iotaNamesRegistration],
    });

    const sender = txb.moveCall({
        target: '0x2::tx_context::sender',
    });

    txb.transferObjects([display], sender);
};
