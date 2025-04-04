// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Transfer the ownership of the IOTA-Names package and all its related packages and objects like the AdminCap and Display.

import { Transaction } from '@iota/iota-sdk/transactions';

import { readPackageInfo } from '../config/constants';
import { getClient, getIotaNamesAdminObjects, prepareMultisigTx } from '../utils/utils';

const network = 'localnet';
const config = readPackageInfo(network);

// The new multisig address to transfer the objects to.
const NEW_MULTISIG_ADDR = '0x1ca3c38e888493f869ac35346a2041d6cf87b0b935ebba14b35a08811d8a76e4';

const profitsToTreasury = (txb: Transaction) => {
	const generalProfits = txb.moveCall({
		target: `${config.packageId}::iota_names::withdraw`,
		arguments: [txb.object(config.adminCap), txb.object(config.iotaNames)],
	});

	txb.transferObjects([generalProfits], txb.pure.address(config.treasuryAddress!));
};

const treasuryClaimAndMoveCapsToFoundation = async () => {
	const client = getClient(network);

	const objectsToTransfer = await getIotaNamesAdminObjects(config, client);
	console.log('Objects to transfer:', objectsToTransfer.length);
	console.log(objectsToTransfer);

	const txb = new Transaction();

	// transfer profits to treasury
	profitsToTreasury(txb);

	txb.transferObjects(objectsToTransfer, txb.pure.address(NEW_MULTISIG_ADDR));

	await prepareMultisigTx(txb, network, config.adminAddress);
};

treasuryClaimAndMoveCapsToFoundation();
