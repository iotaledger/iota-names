// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IOTA_CLOCK_OBJECT_ID, isValidIotaAddress } from '@iota/iota-sdk/utils';

import { isValidIotaName, normalizeIotaName } from '../../sdk/src/utils';

// import { readPackageInfo } from '../config/constants';

const YEARS_TO_RESERVE = 1;

// // Extract `network` argument from command-line arguments
// const args = process.argv.slice(2); // Get arguments passed to the script
// if (args.length !== 1) {
//     throw new Error('Invalid number of arguments. You must provide the `network` argument.');
// }
// const network = args[0]; // First argument should be the network

// Parses a CSV file with name,address pairs
export const parseCsvFile = (filePath: string): Record<string, string> => {
	const fileContent = fs.readFileSync(filePath).toString();

	const nameAddressPairs: Record<string, string> = {};
	fileContent
		.split('\n')
		.map((x) => x.split(','))
		// Remove empty lines
		.filter((x) => !!x && !!x[0])
		.map(([name, address]) => {
			const normalizedName = normalizeIotaName(name + '.iota', 'dot');
			const isValidName = isValidIotaName(normalizedName);
			if (!isValidName) throw new Error(`Invalid name: ${address} | ${name}`);
			const isValidAddress = isValidIotaAddress(address);
			if (!isValidAddress) throw new Error(`Invalid address: ${address} | ${name}`);
			nameAddressPairs[normalizedName] = address;
			return undefined;
		});
	return nameAddressPairs;
};

export const reserveDomains = (
	txb: Transaction,
	nameAddressPairs: Record<string, string>,
	iotaNamesPackageId: string,
	adminCap: string,
	iotaNamesObjectId: string,
) => {
	return txb.moveCall({
		target: `${iotaNamesPackageId}::admin::reserve_domains`,
		arguments: [
			txb.object(adminCap),
			txb.object(iotaNamesObjectId),
			txb.pure.vector('string', Object.keys(nameAddressPairs)),
			txb.pure.u8(YEARS_TO_RESERVE),
			txb.object(IOTA_CLOCK_OBJECT_ID),
		],
	});
};

// const prepareTx = (nameAddressPairs: Record<string, string>) => {
//     const packageInfo = readPackageInfo(network);

//     const txb = new Transaction();
//     reserveDomains(txb, nameAddressPairs, packageInfo.packageId, packageInfo.adminCap, packageInfo.iotaNames);

//     return prepareMultisigTx(txb, network, packageInfo.adminAddress);
// };

// const nameAddressPairs = parseCsvFile('./reserved-names/sample/sample.csv');
// console.log(`Registering ${Object.keys(nameAddressPairs).length} names:`, nameAddressPairs)

// Prepares the transaction and save it in tx-data.
// prepareTx(nameAddressPairs);
