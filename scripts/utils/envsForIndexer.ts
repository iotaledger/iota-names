// Copyright (c) 2026 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Get environment variables from a config to set for the iota-names-indexer.
// Also collects all package IDs (hex strings starting with 0x and 66 chars long) into EVENT_PACKAGE_IDS.
// Usage: pnpm run envsForIndexer <network> [file] [shell]

import * as fs from 'fs';

/**
 * Formats an environment variable for the specified shell.
 */
function formatEnvVar(name: string, value: string, shell: string): string {
    if (shell === 'fish') {
        return `set -x ${name} ${value};`;
    }
    // Default to bash/zsh
    return `export ${name}=${value}`;
}

/**
 * Recursively collects package IDs (hex strings of 66 characters starting with 0x) from the config object.
 */
function collectPackageIds(obj: any, arr: string[], isPackageId: boolean = false): void {
    if (typeof obj === 'string' && isPackageId && /^0x[a-f0-9]{64}$/.test(obj)) {
        arr.push(obj);
    } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            const newIsPackageId = isPackageId || key.toLowerCase().includes('packageid');
            collectPackageIds(value, arr, newIsPackageId);
        }
    }
}

// Parse command line arguments
const [, , network, arg3, arg4] = process.argv;

let file: string | undefined;
let shell = 'bash';

if (arg3) {
    if (arg3 === 'bash' || arg3 === 'fish') {
        shell = arg3;
        file = arg4;
    } else {
        file = arg3;
        if (arg4 === 'bash' || arg4 === 'fish') {
            shell = arg4;
        }
    }
}

if (!network) {
    console.error('Usage: pnpm run envsForIndexer <network> [file] [shell]');
    process.exit(1);
}

// Load and parse the config file
const configFilePath = `package-info/${network}.json`;
if (!fs.existsSync(configFilePath)) {
    console.error(`Error: JSON config file not found at ${configFilePath}`);
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

// Define environment variables mapping
const envVars: Record<string, string> = {
    IOTA_NAMES_PACKAGE_ADDRESS: config.packageId.v1,
    IOTA_NAMES_OBJECT_ID: config.iotaNamesObjectId,
    IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS: config.paymentsPackageId.v1,
    IOTA_NAMES_REGISTRY_ID: config.registryTableId,
    IOTA_NAMES_REVERSE_REGISTRY_ID: config.reverseRegistryTableId,
    IOTA_NAMES_AUCTION_PACKAGE_ADDRESS: config.auctionPackageId.v1,
    IOTA_NAMES_COUPONS_PACKAGE_ADDRESS: config.couponsPackageId.v1,
    IOTA_NAMES_SUBNAMES_PACKAGE_ADDRESS: config.subnamesPackageId.v1,
    IOTA_NAMES_TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS: config.tempSubnameProxyPackageId.v1,
    IOTA_NAMES_AUCTION_HOUSE_OBJECT_ID: config.auctionHouseObjectId,
};

// Collect package IDs for events
const eventPackageIds: string[] = [];
collectPackageIds(config, eventPackageIds);

// Generate output lines
const outputLines = Object.entries(envVars).map(([key, value]) => formatEnvVar(key, value, shell));
outputLines.push(formatEnvVar('EVENT_PACKAGE_IDS', JSON.stringify(eventPackageIds), shell));

// Output to file or console
if (file) {
    fs.writeFileSync(file, outputLines.join('\n') + '\n');
} else {
    outputLines.forEach((line) => console.log(line));
}
