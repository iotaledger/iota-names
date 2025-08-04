// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export function getNameDisplaySrc(name: string, expirationTimestamp: number) {
    const baseUrl = process.env.NEXT_PUBLIC_NAMES_DISPLAY_API_URL;
    return new URL(`${name}/${expirationTimestamp}`, baseUrl).href;
}
