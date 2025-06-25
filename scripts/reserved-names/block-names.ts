// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { Transaction } from '@iota/iota-sdk/transactions';

// Parses a text file with comma-separated names (labels without ".iota")
export const parseTextFile = (filePath: string): string[] => {
    const fileContent = fs.readFileSync(filePath, 'utf8').trim();

    if (!fileContent) {
        return [];
    }

    return fileContent
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
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
