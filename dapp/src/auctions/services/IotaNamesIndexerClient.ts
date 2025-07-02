// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export class IotaNamesIndexerClient {
    private host: string;

    constructor(host: string) {
        this.host = new URL(host).origin;
    }

    async getUserAuctions(address: string): Promise<string[]> {
        const response = await fetch(`${this.host}/auctions/${address}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch auctions: ${response.statusText}`);
        }

        return response.json();
    }
}
