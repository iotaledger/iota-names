// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { bcs } from '@iota/iota-sdk/bcs';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IOTA_CLOCK_OBJECT_ID, isValidIotaAddress } from '@iota/iota-sdk/utils';

import { isValidIotaName, normalizeIotaName } from '@iota/iota-names-sdk';

import { signAndExecute } from '../utils/utils';

const YEARS_TO_RESERVE = 1;

// Parses a CSV file with <name>[,address] pairs, names without ".iota"
export const parseCsvFile = (filePath: string): Record<string, string | undefined> => {
    const fileContent = fs.readFileSync(filePath).toString();

    const nameAddressPairs: Record<string, string | undefined> = {};
    const seen = new Set<string>();
    fileContent
        .split('\n')
        // Ignore comments
        .filter((l) => l.startsWith('#') === false)
        .map((x) => x.split(','))
        // Ignore empty lines
        .filter((x) => !!x && !!x[0])
        .map(([name, address]) => {
            const normalizedName = normalizeIotaName(name + '.iota', 'dot');
            const isValidName = isValidIotaName(normalizedName);
            if (!isValidName) throw new Error(`Invalid name: ${address} | ${name}`);
            if (seen.has(normalizedName)) {
                return undefined; // skip duplicates
            }
            seen.add(normalizedName);
            if (address) {
                const isValidAddress = isValidIotaAddress(address);
                if (!isValidAddress) throw new Error(`Invalid address: ${address} | ${name}`);
            }
            nameAddressPairs[normalizedName] = address || undefined;
            return undefined;
        });
    return nameAddressPairs;
};

export const registerNames = (
    txb: Transaction,
    batch: Record<string, string>,
    iotaNamesPackageId: { [version: string]: string },
    adminCap: string,
    iotaNamesObjectId: string,
) => {
    var names = Object.keys(batch);
    var recipients = names.map((name) => batch[name]);

    txb.moveCall({
        target: `${iotaNamesPackageId.v1}::admin::register_names`,
        arguments: [
            txb.object(adminCap),
            txb.object(iotaNamesObjectId),
            txb.pure.vector('string', names),
            txb.pure(bcs.vector(bcs.Address).serialize(recipients)),
            txb.pure.u8(YEARS_TO_RESERVE),
            txb.object(IOTA_CLOCK_OBJECT_ID),
        ],
    });
};

// Arg size needs to be limited to not exceed protocol limits
const PURE_ARG_SIZE_LIMIT = 8500;

// Batch and process names from a file
export async function processNamesFileBatched(
    filePath: string,
    packageInfo: {
        packageId: { [version: string]: string };
        adminCap: string;
        iotaNamesObjectId: string;
    },
    network: string,
    client: any,
    adminAddress: string,
) {
    const nameAddressPairs = parseCsvFile(filePath);
    let batch: Record<string, string> = {};
    let batchNameLen = 0;
    let batchRecipientLen = 0;
    for (const [name, address] of Object.entries(nameAddressPairs)) {
        var recipient = address || adminAddress;
        const nameLen = bcs.String.serializedSize(name)!;
        const recipientLen = bcs.Address.serializedSize(recipient)!;
        if (
            batchNameLen + nameLen > PURE_ARG_SIZE_LIMIT ||
            batchRecipientLen + recipientLen > PURE_ARG_SIZE_LIMIT
        ) {
            await sendNamesBatchTransaction(batch, packageInfo, network, client);
            batch = {};
            batchNameLen = 0;
            batchRecipientLen = 0;
        }
        batch[name] = recipient;
        batchNameLen += nameLen;
        batchRecipientLen += recipientLen;
    }
    if (Object.keys(batch).length > 0) {
        await sendNamesBatchTransaction(batch, packageInfo, network, client);
    }
}

async function sendNamesBatchTransaction(
    batch: Record<string, string>,
    packageInfo: {
        packageId: { [version: string]: string };
        adminCap: string;
        iotaNamesObjectId: string;
    },
    network: string,
    client: any,
) {
    const tx = new Transaction();
    console.log(`Registering ${Object.keys(batch).length} names`);
    registerNames(
        tx,
        batch,
        packageInfo.packageId,
        packageInfo.adminCap,
        packageInfo.iotaNamesObjectId,
    );
    const result = await signAndExecute(tx, network);
    await client.waitForTransaction({ digest: result.digest });
    console.log(`Transaction digest: ${result.digest}`);
}

// Run this to see what names would be registered:
// const nameAddressPairs = parseCsvFile('./init/names-to-register.csv');
// console.log(`Registering ${Object.keys(nameAddressPairs).length} names:`, nameAddressPairs);
