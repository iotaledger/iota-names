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

    async getAuctionList(
        search?: string,
        sort?: 'asc' | 'desc',
        sortBy?: 'bid' | 'name',
    ): Promise<string[]> {
        const url = new URL(`${this.host}/auctions`);
        if (search) {
            url.searchParams.set('search', search);
        }
        if (sort) {
            url.searchParams.set('sort', sort);
        }
        if (sortBy) {
            url.searchParams.set('sortBy', sortBy);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Failed to fetch auction list: ${response.statusText}`);
        }

        return response.json();
    }
}
