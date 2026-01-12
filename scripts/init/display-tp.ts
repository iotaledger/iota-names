// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

export const getImageUrl = (isSubname: boolean, network: string) => {
    const name = `{${isSubname ? 'nft.' : ''}name_str}`;
    const expiration = `{${isSubname ? 'nft.' : ''}expiration_timestamp_ms}`;

    return `https://display.iotanames.com/${name}/${expiration}`;
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
    const nameRegistration = `${iotaNamesPackageId}::name_registration::NameRegistration`;

    const display = txb.moveCall({
        target: `0x2::display::new`,
        arguments: [txb.object(publisher)],
        typeArguments: [isSubname ? subnameRegistration : nameRegistration],
    });

    txb.moveCall({
        target: `0x2::display::add_multiple`,
        arguments: [
            display,
            txb.pure.vector('string', ['name', 'image_url', 'description', 'project_url']),
            txb.pure.vector('string', [
                `{${isSubname ? 'nft.' : ''}name_str}`,
                getImageUrl(isSubname, network),
                'IOTA-Names - Name It. Own It.',
                'https://iotanames.com',
            ]),
        ],
        typeArguments: [isSubname ? subnameRegistration : nameRegistration],
    });

    txb.moveCall({
        target: `0x2::display::update_version`,
        arguments: [display],
        typeArguments: [isSubname ? subnameRegistration : nameRegistration],
    });

    const sender = txb.moveCall({
        target: '0x2::tx_context::sender',
    });

    txb.transferObjects([display], sender);
};
