// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { Transaction } from '@iota/iota-sdk/transactions';
import { normalizeIotaAddress } from '@iota/iota-sdk/utils';
import { retry } from 'ts-retry-promise';
import { beforeAll, describe, expect, it } from 'vitest';

import { ALLOWED_METADATA, IotansClient, IotansTransaction } from '../src';
import { execute, publishAndSetupIotansContracts } from './setup';
import { setupIotaClient, TestToolbox } from './toolbox';

/**
 * This e2e iotate needs to run sequential (state needs to be preserved on-chain across)
 * these tests, and the order they are written is important for the tests to pass.
 */
describe('Testing IOTANS SDK e2e', () => {
	let toolbox: TestToolbox;
	let iotansClient: IotansClient;
	const name = 'test.iota';

	beforeAll(async () => {
		toolbox = await setupIotaClient();

		// publish and setup these contracts and get back the constants (packageIds / objectIds).
		const constants = await retry(() => publishAndSetupIotansContracts(toolbox), {
			backoff: 'EXPONENTIAL',
			// overall timeout in 2 minutes
			timeout: 1000 * 60 * 2,
			logger: (msg) => console.warn('Retrying publishing the contracts: ' + msg),
		});

		iotansClient = new IotansClient({
			client: toolbox.client,
			packageIds: constants,
		});
	});

	it('Should return null as a non-existing name', async () => {
		const result = await iotansClient.getNameRecord('5215153153534543653.iota');
		expect(result).toBeNull();
	});

	it('Should register a new name, renew it, set the target address, set it as default', async () => {
		const transaction = new Transaction();
		const iotansTxb = new IotansTransaction(iotansClient, transaction);

		const priceList = await iotansClient.getPriceList();
		const renewalPriceList = await iotansClient.getRenewalPriceList();

		const years = 1;

		// register test.iota for a year.
		const nft = iotansTxb.register({
			name,
			years,
			price: iotansClient.calculatePrice({ name, years, priceList }),
		});

		// renew for another 2 years.
		iotansTxb.renew({
			nftId: nft,
			years: 2,
			price: iotansClient.calculatePrice({
				name,
				years: 2,
				priceList: renewalPriceList,
			}),
		});

		// Sets the target address of the NFT.
		iotansTxb.setTargetAddress({
			nft,
			address: toolbox.address(),
			isSubname: false,
		});

		iotansTxb.setDefault(name);

		// Sets the avatar of the NFT.
		iotansTxb.setUserData({
			nft,
			key: ALLOWED_METADATA.avatar,
			value: '0x0',
		});

		iotansTxb.setUserData({
			nft,
			key: ALLOWED_METADATA.contentHash,
			value: '0x1',
		});

		transaction.transferObjects([nft], transaction.pure.address(toolbox.address()));

		const res = await execute(toolbox, transaction);

		expect(res.effects?.status.status).toBe('success');

		// Fetch and check the name record.
		const nameRecord = await iotansClient.getNameRecord(name);

		expect(nameRecord?.name).toBe(name);
		expect(nameRecord?.targetAddress).toBe(toolbox.address());
		expect(nameRecord?.contentHash).toBe('0x1');
		expect(nameRecord?.avatar).toBe('0x0');
	});

	it('Should create some node subnames and call functionality with these', async () => {
		const transaction = new Transaction();
		const iotansTxb = new IotansTransaction(iotansClient, transaction);

		const subName = 'node.test.iota';

		const parentNameRecord = await iotansClient.getNameRecord(name);
		if (!parentNameRecord) throw new Error('Parent not found');

		const subNameNft = iotansTxb.createSubName({
			parentNft: parentNameRecord.nftId,
			name: subName,
			expirationTimestampMs: parentNameRecord.expirationTimestampMs,
			allowChildCreation: true,
			allowTimeExtension: true,
		});

		iotansTxb.setUserData({
			nft: subNameNft,
			key: ALLOWED_METADATA.contentHash,
			value: '0x1',
			isSubname: true,
		});

		// Check set the target address for a subname.
		iotansTxb.setTargetAddress({
			nft: subNameNft,
			address: toolbox.address(),
			isSubname: true,
		});
		// Check setting the subname as default.
		iotansTxb.setDefault(subName);

		transaction.transferObjects([subNameNft], transaction.pure.address(toolbox.address()));

		const res = await execute(toolbox, transaction);
		expect(res.effects?.status.status).toBe('success');

		// Fetch and check the subname record.
		const nameRecord = await iotansClient.getNameRecord(subName);

		expect(nameRecord?.name).toBe(subName);
		expect(nameRecord?.targetAddress).toBe(toolbox.address());
		expect(nameRecord?.expirationTimestampMs).toEqual(parentNameRecord.expirationTimestampMs);
		expect(nameRecord?.contentHash).toBe('0x1');
	});

	it('Should create leaf subnames, and remove them too', async () => {
		const transaction = new Transaction();
		const iotansTxb = new IotansTransaction(iotansClient, transaction);
		const leaf = 'leaf.test.iota';
		const anotherSubname = 'another.test.iota';

		const parentNameRecord = await iotansClient.getNameRecord(name);
		if (!parentNameRecord) throw new Error('Parent not found');

		iotansTxb.createLeafSubName({
			parentNft: parentNameRecord.nftId,
			name: leaf,
			targetAddress: '0x2',
		});

		iotansTxb.createLeafSubName({
			parentNft: parentNameRecord.nftId,
			name: anotherSubname,
			targetAddress: '0x3',
		});
		const res = await execute(toolbox, transaction);
		expect(res.effects?.status.status).toBe('success');

		// Fetch and check the subname record.
		const nameRecord = await iotansClient.getNameRecord(leaf);
		expect(nameRecord?.name).toBe(leaf);
		expect(nameRecord?.targetAddress).toBe(normalizeIotaAddress('0x2'));
	});

	it('Should be able to remove the leaf names created', async () => {
		const transaction = new Transaction();
		const iotansTxb = new IotansTransaction(iotansClient, transaction);

		const parentNameRecord = await iotansClient.getNameRecord(name);
		if (!parentNameRecord) throw new Error('Parent not found');

		iotansTxb.removeLeafSubName({
			parentNft: parentNameRecord.nftId,
			name: 'leaf.test.iota',
		});

		const res = await execute(toolbox, transaction);
		expect(res.effects?.status.status).toBe('success');
	});

	it('Should be able to unset the target address', async () => {
		const transaction = new Transaction();
		const iotansTxb = new IotansTransaction(iotansClient, transaction);

		let parentNameRecord = await iotansClient.getNameRecord(name);
		if (!parentNameRecord) throw new Error('Parent not found');

		iotansTxb.setTargetAddress({
			nft: parentNameRecord.nftId,
			isSubname: false,
		});

		const res = await execute(toolbox, transaction);
		expect(res.effects?.status.status).toBe('success');

		parentNameRecord = await iotansClient.getNameRecord(name);
		if (!parentNameRecord) throw new Error('Parent not found');

		expect(parentNameRecord.targetAddress).toBeNull();
	});
});
