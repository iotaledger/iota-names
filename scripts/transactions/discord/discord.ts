// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { PackageInfo } from '../../config/constants';

export const discordRoles = {
	master: {
		id: 0,
		percentage: 100,
	},
	adept: {
		id: 1,
		percentage: 50,
	},
	superOG: {
		id: 2,
		percentage: 75,
	},
	citizen: {
		id: 3,
		percentage: 15,
	},
	earlyTester: {
		id: 4,
		percentage: 90,
	},
	supporter2022: {
		id: 5,
		percentage: 10,
	},
	twitterFam: {
		id: 6,
		percentage: 10,
	},
	iotansFriend: {
		id: 7,
		percentage: 50,
	},
	iotansVip: {
		id: 8,
		percentage: 100,
	},
	serverBoost: {
		id: 9,
		percentage: 50,
	},
};

export const authorizeDiscordApp = (txb: Transaction, config: PackageInfo) => {
	txb.moveCall({
		target: `${config.coupons.packageId}::coupon_house::authorize_app`,
		arguments: [txb.object(config.adminCap), txb.object(config.iotans)],
		typeArguments: [`${config.discord?.packageId}::discord::DiscordApp`],
	});
};

// add role to discord.
export const addDiscordRole = (
	txb: Transaction,
	role: {
		id: number;
		percentage: number;
	},
	config: PackageInfo,
) => {
	txb.moveCall({
		target: `${config.discord?.packageId}::discord::add_discord_role`,
		arguments: [
			txb.object(config.discord!.discordCap),
			txb.object(config.discord!.discordObjectId),
			txb.pure.u8(role.id),
			txb.pure.u8(role.percentage),
		],
	});
};

export const setPublicKey = async (txb: Transaction, pubKey: Uint8Array, config: PackageInfo) => {
	if (!pubKey || pubKey.length === 0) throw new Error('Invalid Public Key on configuration');

	txb.moveCall({
		target: `${config.discord?.packageId}::discord::set_public_key`,
		arguments: [
			txb.object(config.discord!.discordCap),
			txb.object(config.discord!.discordObjectId),
			txb.pure.vector('u8', [...pubKey]),
		],
	});
};
