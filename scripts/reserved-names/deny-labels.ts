// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { Transaction } from '@iota/iota-sdk/transactions';

import { signAndExecute } from '../utils/utils';

// Arg size needs to be limited to not exceed protocol limits
const PURE_ARG_SIZE_LIMIT = 10000;
const LABEL_REGEX = /(?!-)[a-z0-9-]{0,62}[a-z0-9]/;

// Parses a text file with comma-separated labels
export const parseLabelsFile = (filePath: string): string[] => {
    const fileContent = fs.readFileSync(filePath, 'utf8').trim();

    if (!fileContent) {
        return [];
    }

    // Convert to lowercase, trim, and remove duplicates
    const seen = new Set<string>();
    return fileContent
        .split(',')
        .map((label) => label.trim().toLowerCase())
        .filter((label) => {
            if (!LABEL_REGEX.test(label)) {
                throw new Error(`Invalid label provided: "${label}"`);
            }
            if (seen.has(label)) {
                return false;
            }
            seen.add(label);
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

// Check if a label file exists and has at least one valid label
export const hasLabelsInFile = (filePath: string): boolean => {
    if (!fs.existsSync(filePath)) return false;
    try {
        const labels = parseLabelsFile(filePath);
        return labels.length > 0;
    } catch {
        return false;
    }
};

// Type for package info
export type PackageInfoForLabels = {
    packageId: string;
    iotaNamesObjectId: string;
    adminCap: string;
};

// Process a batch of labels for blocking or reserving
export function processLabelsBatch(
    tx: Transaction,
    packageInfo: PackageInfoForLabels,
    action: 'block' | 'reserve',
    labels: string[],
): void {
    const { packageId, iotaNamesObjectId, adminCap } = packageInfo;
    if (action === 'block') {
        addBlockedLabels(tx, packageId, iotaNamesObjectId, adminCap, labels);
    } else {
        addReservedLabels(tx, packageId, iotaNamesObjectId, adminCap, labels);
    }
}

// Shared function to batch and process labels from a file
export async function processLabelsFileBatched(
    filePath: string,
    action: 'block' | 'reserve',
    packageInfo: PackageInfoForLabels,
    network: string,
    client: any,
): Promise<void> {
    if (!hasLabelsInFile(filePath)) return;
    const allLabels = parseLabelsFile(filePath);
    let batch: string[] = [];
    let batchLen = 0;
    for (const label of allLabels) {
        const labelLen = label.length + (batch.length > 0 ? 1 : 0);
        if (batchLen + labelLen > PURE_ARG_SIZE_LIMIT) {
            const tx = new Transaction();
            console.log(`${action === 'block' ? 'Blocking' : 'Reserving'} ${batch.length} labels`);
            processLabelsBatch(tx, packageInfo, action, batch);
            const result = await signAndExecute(tx, network);
            await client.waitForTransaction({ digest: result.digest });
            console.log(`Transaction digest: ${result.digest}`);
            batch = [];
            batchLen = 0;
        }
        batch.push(label);
        batchLen += labelLen;
    }
    if (batch.length > 0) {
        const tx = new Transaction();
        console.log(`${action === 'block' ? 'Blocking' : 'Reserving'} ${batch.length} labels`);
        processLabelsBatch(tx, packageInfo, action, batch);
        const result = await signAndExecute(tx, network);
        await client.waitForTransaction({ digest: result.digest });
        console.log(`Transaction digest: ${result.digest}`);
    }
}
