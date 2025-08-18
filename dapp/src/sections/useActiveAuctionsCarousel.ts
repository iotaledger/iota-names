// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useAuctions } from '@/auctions/hooks/useAuctions';

/**
 * Hook for fetching active auctions to display in the carousel on the landing page
 */
export function useActiveAuctionsCarousel() {
    return useAuctions({
        status: 'active',
        search: '',
        page: 1,
        pageSize: 20,
        sortBy: 'bid',
        sort: 'desc',
    });
}
