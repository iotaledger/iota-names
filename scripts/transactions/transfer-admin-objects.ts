// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Transfer the ownership of the IOTA-Names package and all its related packages and objects like the AdminCap and Display.

import { Transaction } from '@iota/iota-sdk/transactions';

import { readPackageInfo } from '../package-info/constants';
import { getClient, getIotaNamesAdminObjects, prepareMultisigTx } from '../utils/utils';
import { profitsToTreasury } from './funds-to-treasury';

// Extract `newAddress` argument from command-line arguments
const args = process.argv.slice(2); // Get arguments passed to the script
if (args.length !== 1) {
    throw new Error('Invalid number of arguments. You must provide the `newAddress` argument.');
}
const newAddress = args[0]; // First argument should be new address

const treasuryClaimAndMoveCapsToFoundation = async () => {
    const network = process.env.NETWORK;
    if (!network) {
        throw new Error(
            'Network not defined. Please run `export NETWORK=mainnet|testnet|devnet|localnet`',
        );
    }
    const packageInfo = readPackageInfo(network);

    const client = getClient(network);

    const objectsToTransfer = await getIotaNamesAdminObjects(packageInfo, client);
    console.log('Objects to transfer:', objectsToTransfer.length);
    console.log(objectsToTransfer);

    const txb = new Transaction();
    profitsToTreasury(txb, packageInfo, newAddress);

    txb.transferObjects(objectsToTransfer, txb.pure.address(newAddress));

    await prepareMultisigTx(txb, network, packageInfo.adminAddress);
};

treasuryClaimAndMoveCapsToFoundation();
