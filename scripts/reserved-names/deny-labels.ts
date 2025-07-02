// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { Transaction } from '@iota/iota-sdk/transactions';

const LABEL_REGEX = /(?!-)[a-z0-9-]{0,62}[a-z0-9]/;

// Parses a text file with comma-separated labels
export const parseTextFile = (filePath: string): string[] => {
    const fileContent = fs.readFileSync(filePath, 'utf8').trim();

    if (!fileContent) {
        return [];
    }

    return fileContent
        .split(',')
        .map((label) => label.trim())
        .filter((label) => {
            if (!LABEL_REGEX.test(label)) {
                throw new Error(`Invalid label provided: "${label}"`);
            }
            return true;
        });
};

export const addBlockedLabels = (
    txb: Transaction,
    iotaNamesPackageId: string,
    iotaNamesObjectId: string,
    adminCap: string,
    labels: string[],
) => {
    return txb.moveCall({
        target: `${iotaNamesPackageId}::deny_list::add_blocked_labels`,
        arguments: [
            txb.object(iotaNamesObjectId),
            txb.object(adminCap),
            txb.pure.vector('string', labels),
        ],
    });
};

export const addReservedLabels = (
    txb: Transaction,
    iotaNamesPackageId: string,
    iotaNamesObjectId: string,
    adminCap: string,
    labels: string[],
) => {
    return txb.moveCall({
        target: `${iotaNamesPackageId}::deny_list::add_reserved_labels`,
        arguments: [
            txb.object(iotaNamesObjectId),
            txb.object(adminCap),
            txb.pure.vector('string', labels),
        ],
    });
};

// Check if any label files exist
export const hasLabelFilesToProcess = (): boolean => {
    const files = ['./init/labels-to-block.txt', './init/labels-to-reserve.txt'];

    return files.some((path) => fs.existsSync(path));
};

// Reserve and block labels from files if provided
export const processLabelFiles = (
    tx: Transaction,
    packageId: string,
    iotaNamesObjectId: string,
    adminCap: string,
): boolean => {
    const files = [
        { path: './init/labels-to-block.txt', action: 'Blocking', fn: addBlockedLabels },
        { path: './init/labels-to-reserve.txt', action: 'Reserving', fn: addReservedLabels },
    ];

    let hasLabels = false;

    for (const { path, action, fn } of files) {
        if (fs.existsSync(path)) {
            const labels = parseTextFile(path);
            if (labels.length > 0) {
                console.log(`${action} ${labels.length} labels`);
                fn(tx, packageId, iotaNamesObjectId, adminCap, labels);
                hasLabels = true;
            }
        }
    }

    return hasLabels;
};
