// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

export function useCalculateRenewalPrice(name: string, years: number) {
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        queryKey: [...queryKey.renewalPrice(name, years)],
        queryFn: async () => {
            const nameRecordPrice = await iotaNamesClient.calculatePrice({
                name,
                years: years,
                isRegistration: false,
            });
            return nameRecordPrice.toString();
        },
        staleTime: 60 * 60 * 1000,
    });
}
