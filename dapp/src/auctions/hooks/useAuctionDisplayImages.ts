// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

export function useAuctionDisplayImages(name: string, expirationTimestamp: string) {
    return useQuery({
        queryKey: ['generateSVG', name, expirationTimestamp],
        queryFn: async () => {
            const baseUrl = process.env.NEXT_PUBLIC_NAMES_DISPLAY_API_URL;

            const response = await fetch(
                `${baseUrl}/${encodeURIComponent(name)}/${expirationTimestamp}`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'image/svg+xml',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`API responded with ${response.status}: ${response.statusText}`);
            }

            const svgText = await response.text();
            const dataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;

            return {
                image: dataUrl,
                svg: svgText,
            };
        },
        enabled: !!name && !!expirationTimestamp,
        gcTime: 0,
    });
}
