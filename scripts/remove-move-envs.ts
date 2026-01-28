// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Removes all [env] sections from Move.lock files in packages/*/
//
// Usage: ts-node scripts/remove-move-env.ts

import fs from 'fs';
import path from 'path';

const PACKAGES_DIR = path.join(__dirname, '../packages');
const TARGET_FILE = 'Move.lock';
const ENV_HEADERS = ['[env]', '[env.devnet]', '[env.testnet]', '[env.mainnet]'];

function findMoveLockFiles(dir: string): string[] {
    return fs
        .readdirSync(dir)
        .map((pkg) => path.join(dir, pkg, TARGET_FILE))
        .filter((f) => fs.existsSync(f));
}

function removeEnvSections(content: string): string {
    const lines = content.split(/\r?\n/);
    const result: string[] = [];
    let skip = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (ENV_HEADERS.includes(line.trim())) {
            skip = true;
            continue;
        }
        if (skip && line.startsWith('[') && line.endsWith(']')) {
            skip = false;
        }
        if (!skip) result.push(line);
    }
    return result.join('\n');
}

function processFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = removeEnvSections(content);
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log(`Cleaned: ${filePath}`);
}

const moveLockFiles = findMoveLockFiles(PACKAGES_DIR);
moveLockFiles.forEach(processFile);

console.log('Done.');
