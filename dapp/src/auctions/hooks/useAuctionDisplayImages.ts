// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

export function useAuctionDisplayImage(name: string, expirationTimestamp: string) {
    return useQuery({
        queryKey: ['generateSVG', name, expirationTimestamp],
        queryFn: async () => {
            const baseUrl = process.env.NEXT_PUBLIC_NAMES_DISPLAY_API_URL;
            const url = `${baseUrl}/${name}/${expirationTimestamp}`;
            return {
                url,
            };
        },
        enabled: !!name && !!expirationTimestamp,
        gcTime: 0,
    });
}
