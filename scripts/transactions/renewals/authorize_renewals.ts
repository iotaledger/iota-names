// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import dotenv from 'dotenv';

import { mainPackage, Network } from '../../config/constants';
import { authorizeApp } from '../../init/authorization';
import { Packages } from '../../init/packages';
import { prepareMultisigTx, signAndExecute } from '../../utils/utils';

dotenv.config();

export const authorize = async (network: Network) => {
	const txb = new Transaction();
	const config = mainPackage[network];

	authorizeApp({
		txb,
		adminCap: config.adminCap,
		iotans: config.iotans,
		type: `${config.renewalsPackageId}::renew::Renew`,
		iotansPackageIdV1: config.packageId,
	});

	Packages('mainnet').Renewal.setupFunction({
		txb,
		adminCap: config.adminCap,
		iotans: config.iotans,
		packageId: config.renewalsPackageId,
		iotansPackageIdV1: config.packageId,
		priceList: {
			three: 50 * Number(NANOS_PER_IOTA),
			four: 10 * Number(NANOS_PER_IOTA),
			fivePlus: 2 * Number(NANOS_PER_IOTA),
		},
	});

	// for mainnet, we just prepare multisig TX
	if (network === 'mainnet') return prepareMultisigTx(txb, 'mainnet');

	return signAndExecute(txb, network);
};

authorize('mainnet');
