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
            if (label.length === 0) {
                return false;
            }
            if (!LABEL_REGEX.test(label)) {
                throw new Error(`Invalid label provided: "${label}"`);
            }
            return true;
        });
};

export const addBlockedNames = (
    txb: Transaction,
    denyListPackageId: string,
    iotaNamesObjectId: string,
    adminCap: string,
    names: string[],
) => {
    return txb.moveCall({
        target: `${denyListPackageId}::deny_list::add_blocked_names`,
        arguments: [
            txb.object(iotaNamesObjectId),
            txb.object(adminCap),
            txb.pure.vector('string', names),
        ],
    });
};
