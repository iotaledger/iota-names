// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/providers/contexts';

export function usePriceList() {
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        queryKey: ['price-list'],
        queryFn: async () => {
            const priceList = await iotaNamesClient.getPriceList();
            const domainLengthRanges = Array.from(priceList.keys()) as [number, number][];
            const minLength = Math.min(...domainLengthRanges.map(([from]) => from));
            const maxLength = Math.max(...domainLengthRanges.map(([, to]) => to));

            return { priceList, minLength, maxLength };
        },
        staleTime: 60 * 60 * 1000,
    });
}
