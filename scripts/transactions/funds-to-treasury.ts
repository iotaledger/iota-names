// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { PackageInfo, readPackageInfo } from '../package-info/constants';
import { prepareMultisigTx } from '../utils/utils';

// Extract `treasuryAddress` argument from command-line arguments
const args = process.argv.slice(2); // Get arguments passed to the script
if (args.length !== 1) {
    throw new Error(
        'Invalid number of arguments. You must provide the `treasuryAddress` argument.',
    );
}

const treasuryAddress = args[0]; // First argument should be treasury address

const craftTx = async () => {
    const network = process.env.NETWORK;
    if (!network) {
        throw new Error(
            'Network not defined. Please run `export NETWORK=mainnet|testnet|devnet|localnet`',
        );
    }

    const packageInfo = readPackageInfo(network);

    const txb = new Transaction();
    profitsToTreasury(txb, packageInfo, treasuryAddress);

    await prepareMultisigTx(txb, network, packageInfo.adminAddress);
};

craftTx();

export async function profitsToTreasury(
    txb: Transaction,
    packageInfo: PackageInfo,
    treasuryAddress: string,
) {
    const generalProfits = txb.moveCall({
        target: `${packageInfo.packageId.v1}::iota_names::withdraw`,
        arguments: [txb.object(packageInfo.iotaNamesObjectId), txb.object(packageInfo.adminCap)],
        typeArguments: ['0x2::iota::IOTA'],
    });
    txb.transferObjects([generalProfits], txb.pure.address(treasuryAddress));
}
