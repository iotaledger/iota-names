// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IOTA_CLOCK_OBJECT_ID, isValidIotaAddress } from '@iota/iota-sdk/utils';

import { isValidIotaName, normalizeIotaName } from '../../sdk/src/utils';

const YEARS_TO_RESERVE = 1;

// Parses a CSV file with <name>[,address] pairs, names without ".iota"
export const parseCsvFile = (filePath: string): Record<string, string | undefined> => {
    const fileContent = fs.readFileSync(filePath).toString();

    const nameAddressPairs: Record<string, string | undefined> = {};
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
    names: string[],
    iotaNamesPackageId: string,
    adminCap: string,
    iotaNamesObjectId: string,
) => {
    return txb.moveCall({
        target: `${iotaNamesPackageId}::admin::register_names`,
        arguments: [
            txb.object(adminCap),
            txb.object(iotaNamesObjectId),
            txb.pure.vector('string', names),
            txb.pure.u8(YEARS_TO_RESERVE),
            txb.object(IOTA_CLOCK_OBJECT_ID),
        ],
    });
};

// Run this to see what names would be registered:
// const nameAddressPairs = parseCsvFile('./init/names-to-register.csv');
// console.log(`Registering ${Object.keys(nameAddressPairs).length} names:`, nameAddressPairs);
