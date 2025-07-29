// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { Transaction } from '@iota/iota-sdk/transactions';

import { readPackageInfo, writePackageInfo } from '../package-info/constants';
import { parseLabelsFile, processLabelsFileBatched } from '../reserved-names/deny-labels';
import { parseCsvFile, registerNames } from '../reserved-names/register-names';
import { getClient, getIotaNamesAdminObjects, signAndExecute } from '../utils/utils';
import { publishPackages } from './publish';
import { setup } from './setup';

// Extract `network` and `newOwner` argument from command-line arguments
const args = process.argv.slice(2); // Get arguments passed to the script
if (args.length < 1 || args.length > 2) {
    throw new Error(
        'Invalid number of arguments. You must at least provide the `network` argument, `newOwner` is optional.',
    );
}

const network = args[0]; // First argument should be the network
const newOwner = args[1]; // Second argument should be the address of the new owner

export const init = async (
    network: string | undefined,
    newOwner: string | undefined,
    isCIJob: boolean,
) => {
    // Validate label and name files before proceeding
    validateLabelAndNameFiles();
    if (!network) {
        throw new Error(
            '`network` not defined. Please run `pnpm ts-node init.ts <network>` (e.g., mainnet, testnet, devnet, localnet)',
        );
    }

    const published = await publishPackages(network, isCIJob, process.env.CLIENT_CONFIG_FILE);
    console.log('Published:', published);
    await setup(published, network);

    const client = getClient(network);
    const packageInfo = readPackageInfo(network);

    // Blocked and reserved labels (batched)
    await processLabelsFileBatched(
        './init/labels-to-block.txt',
        'block',
        packageInfo,
        network,
        client,
    );
    await processLabelsFileBatched(
        './init/labels-to-reserve.txt',
        'reserve',
        packageInfo,
        network,
        client,
    );

    // Register names
    let namesToRegisterFile = './init/names-to-register.csv';
    if (fs.existsSync(namesToRegisterFile)) {
        const nameAddressPairs = parseCsvFile(namesToRegisterFile);
        const names = Object.keys(nameAddressPairs);
        const nameCount = names.length;
        if (nameCount === 0) {
            console.log('No names to register');
        } else {
            console.log(`Registering ${nameCount} names:`, names);
            const tx = new Transaction();
            registerNames(
                tx,
                names,
                packageInfo.packageId,
                packageInfo.adminCap,
                packageInfo.iotaNamesObjectId,
            );
            const result = await signAndExecute(tx, network);
            await client.waitForTransaction({ digest: result.digest });
            console.log(`Transaction digest: ${result.digest}`);
        }
    }

    if (!newOwner) {
        return;
    }

    const objectsToTransfer = await getIotaNamesAdminObjects(packageInfo, client);

    const tx = new Transaction();
    tx.transferObjects(objectsToTransfer, newOwner);

    const result = await signAndExecute(tx, network);
    await client.waitForTransaction({ digest: result.digest });
    console.log(`Transaction digest: ${result.digest}`);
    // Update config with new owner
    packageInfo.adminAddress = newOwner;
    writePackageInfo(network, packageInfo);
};

// Validate label and name files for invalid entries
function validateLabelAndNameFiles() {
    // Validate blocked labels
    try {
        parseLabelsFile('./init/labels-to-block.txt');
    } catch (e) {
        throw new Error(
            `Blocked labels file contains invalid label(s): ${e instanceof Error ? e.message : e}`,
        );
    }
    // Validate reserved labels
    try {
        parseLabelsFile('./init/labels-to-reserve.txt');
    } catch (e) {
        throw new Error(
            `Reserved labels file contains invalid label(s): ${e instanceof Error ? e.message : e}`,
        );
    }
    // Validate names to register
    const namesToRegisterFile = './init/names-to-register.csv';
    if (fs.existsSync(namesToRegisterFile)) {
        try {
            parseCsvFile(namesToRegisterFile);
        } catch (e) {
            throw new Error(
                `Names to register file contains invalid entry: ${e instanceof Error ? e.message : e}`,
            );
        }
    }
}

init(network, newOwner, !!process.env.IS_CI_JOB);
