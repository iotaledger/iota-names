// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export function normalizeNameInput(name: string) {
    return name.toLowerCase().replace(/\.iota$/i, '');
}
