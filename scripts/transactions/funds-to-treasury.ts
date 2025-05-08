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

// TODO provide network parameter
const craftTx = async () => {
    const txb = new Transaction();
    const packageInfo = readPackageInfo('devnet');

    profitsToTreasury(txb, packageInfo, treasuryAddress);

    await prepareMultisigTx(txb, 'devnet', packageInfo.adminAddress);
};

craftTx();

export async function profitsToTreasury(
    txb: Transaction,
    packageInfo: PackageInfo,
    treasuryAddress: string,
) {
    const generalProfits = txb.moveCall({
        target: `${packageInfo.packageId}::iota_names::withdraw`,
        arguments: [txb.object(packageInfo.iotaNames), txb.object(packageInfo.adminCap)],
        typeArguments: ['0x2::iota::IOTA'],
    });
    txb.transferObjects([generalProfits], txb.pure.address(treasuryAddress));
}
