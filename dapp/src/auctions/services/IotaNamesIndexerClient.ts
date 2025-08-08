// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

interface PaginatedUserAuctions {
    names: string[];
    page: number;
    pageSize: number;
    totalItems: number;
}

export class IotaNamesIndexerClient {
    private host: string;

    constructor(host: string) {
        this.host = new URL(host).origin;
    }

    async getUserAuctions(
        address: string,
        page: number,
        pageSize: number = 50,
    ): Promise<PaginatedUserAuctions> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });
        const response = await fetch(`${this.host}/auctions/${address}?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch auctions: ${response.statusText}`);
        }

        return response.json();
    }
}
