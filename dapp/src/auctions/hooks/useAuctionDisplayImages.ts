// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

export function useAuctionDisplayImages(name: string, expirationTimestamp: string) {
    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: ['generateSVG', name, expirationTimestamp],
        queryFn: async () => {
            const response = await fetch(
                `https://iota-names.iota.cafe/${name}/${expirationTimestamp}`,
            );
            const data = await response.json();
            console.log('Fetched auction display images:', data);
            return data;
        },
        enabled: !!name && !!expirationTimestamp,
        gcTime: 0,
        select: ({ data }) => {
            return {
                image: data.transaction?.display?.data?.image_url || '',
            };
        },
    });
}
