// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { mainPackage } from '../config/constants';
import { setupDiscountForType } from '../config/discounts';
import { prepareMultisigTx } from '../utils/utils';

export const run = async () => {
	const txb = new Transaction();

	const iotaLinkType = (innerType: string) => {
		return `0xf857fa9df5811e6df2a0240a1029d365db24b5026896776ddd1c3c70803bccd3::iotalink::IotaLink<${innerType}>`;
	};

	const iotalinkSolanaType = iotaLinkType(
		'0xf857fa9df5811e6df2a0240a1029d365db24b5026896776ddd1c3c70803bccd3::solana::Solana',
	);

	const ethType = iotaLinkType(
		'0xf857fa9df5811e6df2a0240a1029d365db24b5026896776ddd1c3c70803bccd3::ethereum::Ethereum',
	);

	setupDiscountForType(txb, mainPackage.mainnet, iotalinkSolanaType, {
		threeCharacterPrice: 400n * NANOS_PER_IOTA,
		fourCharacterPrice: 60n * NANOS_PER_IOTA,
		fivePlusCharacterPrice: 10n * NANOS_PER_IOTA,
	});

	setupDiscountForType(txb, mainPackage.mainnet, ethType, {
		threeCharacterPrice: 400n * NANOS_PER_IOTA,
		fourCharacterPrice: 60n * NANOS_PER_IOTA,
		fivePlusCharacterPrice: 10n * NANOS_PER_IOTA,
	});

	await prepareMultisigTx(txb, 'mainnet', mainPackage.mainnet.adminAddress);
};

run();
