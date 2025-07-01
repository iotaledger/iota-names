// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Get environment variables from a config to set for the IOTA CLI.
// pnpm run envs <network> [shell]

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
    IOTA_NAMES_PACKAGE_ADDRESS: json.packageId,
    IOTA_NAMES_OBJECT_ID: json.iotaNamesObjectId,
    IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS: json.paymentsPackageId,
    IOTA_NAMES_REGISTRY_ID: json.registryTableId,
    IOTA_NAMES_REVERSE_REGISTRY_ID: json.reverseRegistryTableId,
    IOTA_NAMES_AUCTION_PACKAGE_ADDRESS: json.auctionPackageId,
    IOTA_NAMES_COUPONS_PACKAGE_ADDRESS: json.couponsPackageId,
    IOTA_NAMES_SUBNAMES_PACKAGE_ADDRESS: json.subNamesPackageId,
    IOTA_NAMES_AUCTION_HOUSE_OBJECT_ID: json.auctionHouseObjectId,
};

function formatEnvVar(name: string, value: string): string {
    if (shell === 'fish') {
        return `set -x ${name} ${value};`;
    }
    // Default to bash/zsh
    return `export ${name}=${value}`;
}

Object.entries(envVars).forEach(([key, value]) => {
    console.log(formatEnvVar(key, value));
});
