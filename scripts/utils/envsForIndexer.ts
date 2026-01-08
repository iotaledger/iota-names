// Copyright (c) 2026 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Get environment variables from a config to set for the iota-names-indexer.
// Also collects all package IDs (hex strings starting with 0x and 66 chars long) into EVENT_PACKAGE_IDS.
// pnpm run envsForIndexer <network> [shell] [file]

import * as fs from 'fs';

const [, , network, shell = 'bash'] = process.argv;

if (!network) {
    console.error('Usage: pnpm run utils/envs.ts <network> [shell]');
    process.exit(1);
}

const filePath = `package-info/${network}.json`;

if (!fs.existsSync(filePath)) {
    console.error(`Error: JSON config file not found at ${filePath}`);
    process.exit(1);
}

const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const envVars = {
    IOTA_NAMES_PACKAGE_ADDRESS: json.packageId.v1,
    IOTA_NAMES_OBJECT_ID: json.iotaNamesObjectId,
    IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS: json.paymentsPackageId.v1,
    IOTA_NAMES_REGISTRY_ID: json.registryTableId,
    IOTA_NAMES_REVERSE_REGISTRY_ID: json.reverseRegistryTableId,
    IOTA_NAMES_AUCTION_PACKAGE_ADDRESS: json.auctionPackageId.v1,
    IOTA_NAMES_COUPONS_PACKAGE_ADDRESS: json.couponsPackageId.v1,
    IOTA_NAMES_SUBNAMES_PACKAGE_ADDRESS: json.subnamesPackageId.v1,
    IOTA_NAMES_TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS: json.tempSubnameProxyPackageId.v1,
    IOTA_NAMES_AUCTION_HOUSE_OBJECT_ID: json.auctionHouseObjectId,
};

function formatEnvVar(name: string, value: string): string {
    if (shell === 'fish') {
        return `set -x ${name} ${value};`;
    }
    // Default to bash/zsh
    return `export ${name}=${value}`;
}

const output: string[] = [];

Object.entries(envVars).forEach(([key, value]) => {
    output.push(formatEnvVar(key, value));
});

function collectHexStrings(obj: any, arr: string[]): void {
    if (typeof obj === 'string' && /^0x[a-f0-9]{64}$/.test(obj)) {
        arr.push(obj);
    } else if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
            collectHexStrings(value, arr);
        }
    }
}

const eventPackageIds: string[] = [];
collectHexStrings(json, eventPackageIds);

output.push(formatEnvVar('EVENT_PACKAGE_IDS', JSON.stringify(eventPackageIds)));

if (process.argv[3] === 'file') {
    fs.writeFileSync('../indexer/docker/.env', output.join('\n') + '\n');
} else {
    output.forEach(line => console.log(line));
}
