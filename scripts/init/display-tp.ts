// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

export const getImageUrl = (isSubdomain: boolean, network: string) => {
    const name = `{${isSubdomain ? 'nft.' : ''}domain_name}`;
    const expiration = `{${isSubdomain ? 'nft.' : ''}expiration_timestamp_ms}`;

    return `https://api-${network}.iota-names.io/nfts/${name}/${expiration}`;
};

/** Creates the display. Should be called for both subnames and names. */
export const createDisplay = ({
    txb,
    publisher,
    isSubdomain,
    iotaNamesPackageId,
    subdomainsPackageId,
    network = 'mainnet',
}: {
    txb: Transaction;
    publisher: string;
    isSubdomain: boolean;
    iotaNamesPackageId: string;
    subdomainsPackageId: string;
    network: string;
}) => {
    const subnameRegistration = `${subdomainsPackageId}::subdomain_registration::SubdomainRegistration`;
    const iotaNamesRegistration = `${iotaNamesPackageId}::iota_names_registration::IotaNamesRegistration`;

    const display = txb.moveCall({
        target: `0x2::display::new`,
        arguments: [txb.object(publisher)],
        typeArguments: [isSubdomain ? subnameRegistration : iotaNamesRegistration],
    });

    txb.moveCall({
        target: `0x2::display::add_multiple`,
        arguments: [
            display,
            txb.pure.vector('string', ['name', 'link', 'image_url', 'description', 'project_url']),
            txb.pure.vector('string', [
                `{${isSubdomain ? 'nft.' : ''}domain_name}`,
                `https://{${isSubdomain ? 'nft.' : ''}domain_name}.id`,
                getImageUrl(isSubdomain, network),
                'IOTA-Names - Sculpt Your Identity',
                'https://iota-names.io',
            ]),
        ],
        typeArguments: [isSubdomain ? subnameRegistration : iotaNamesRegistration],
    });

    txb.moveCall({
        target: `0x2::display::update_version`,
        arguments: [display],
        typeArguments: [isSubdomain ? subnameRegistration : iotaNamesRegistration],
    });

    const sender = txb.moveCall({
        target: '0x2::tx_context::sender',
    });

    txb.transferObjects([display], sender);
};
