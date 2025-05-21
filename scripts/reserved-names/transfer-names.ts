// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { IotaObjectResponse } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { isValidIotaAddress } from '@iota/iota-sdk/utils';

import { readPackageInfo } from '../package-info/constants';
import { prepareMultisigTx } from '../utils/utils';
import { fetchOwnedNames } from './fetch-owned-names';

async function main() {
    await fetchOwnedNames();

    parseOwnedNamesObjects();

    // Parses the `transfers.csv` file, and creates the list of object transfers
    // This file needs to be prepared before running the script, to contain the names and addresses.
    parseCsvFile('./reserved-names/transfers.csv');
    // parseCsvFile('./reserved-names/sample/sample.csv');

    // Prepares the TXB for that and saves it in tx-data.
    prepareTx();
}

main();

// A {name: address} map
const domains: Record<string, string> = {};
// A {recipient, uniqueObjectIds} map
const recipients: Record<string, Set<string>> = {};

type TransferObject = {
    name: string;
    address: string;
    domain: string;
    domainObjectId?: string;
};

type DomainData = {
    objectId: string;
    name: string;
};

// Reads the owned names + formats them in a `name: objectId` format.
const parseOwnedNamesObjects = () => {
    const ownedNamesObjects = JSON.parse(
        fs.readFileSync('./reserved-names/owned-names.json').toString(),
    ) as IotaObjectResponse[];

    const names: DomainData[] = ownedNamesObjects.map(({ data }) => ({
        objectId: data?.objectId || '',
        //@ts-ignore-next-line
        name: data?.content!.fields!.domain_name || '',
    }));

    // Map the names as `name: address`.
    for (let name of names) {
        domains[name.name] = name.objectId;
    }
};

// Parses the combined CSV
const parseCsvFile = (fileName: string) => {
    fs.readFileSync(fileName)
        .toString()
        .split('\n')
        .map((x) => x.split(','))
        .filter((x) => !!x && !!x[0])
        .map(
            ([domain, address]) =>
                ({
                    address,
                    domain: domain.toLowerCase(),
                }) as TransferObject,
        )
        .filter((x) => {
            const isValid = isValidIotaAddress(x.address);
            if (!isValid) console.warn(`Invalid address: ${x.address} | ${x.name} | ${x.domain}`);
            return isValid;
        })
        .map((x) => {
            x.domain = x.domain.endsWith('.iota') ? x.domain : `${x.domain}.iota`;
            return x;
        })
        .map((x) => {
            if (!domains[x.domain]) console.warn(`Couldn't find objectId for name ${x.domain}`);
            x.domainObjectId = domains[x.domain];
            return x;
            // lets find the objectId for that domain.
        })
        .forEach((recipient) => {
            if (!recipients[recipient.address] && recipient.domainObjectId) {
                recipients[recipient.address] = new Set();
                recipients[recipient.address].add(recipient.domainObjectId);
            }
        });

    // recipients -> address -> [] objects it receives
    // console.log(recipients);
};

const prepareTx = () => {
    const network = process.env.NETWORK;
    if (!network) {
        throw new Error(
            'Network not defined. Please run `export NETWORK=mainnet|testnet|devnet|localnet`',
        );
    }

    const txb = new Transaction();
    const pkg = readPackageInfo(network);

    for (let recipient of Object.keys(recipients)) {
        const objects = [...recipients[recipient]].filter((x) => !!x);
        txb.transferObjects([...objects.map((x) => txb.object(x))], txb.pure.address(recipient));
    }

    return prepareMultisigTx(txb, network, pkg.adminAddress);
};
