// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/providers/contexts';

import { queryKey } from './queryKey';

export function useGetDefaultName(address: string) {
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        queryKey: [...queryKey.defaultName(address), ...queryKey.all],
        async queryFn() {
            const defaultName = await iotaNamesClient.getDefaultName(address);

            return defaultName;
        },
        enabled: !!iotaNamesClient && address.length > 0,
    });
}
