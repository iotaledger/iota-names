// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

export function useCoreConfig() {
    const { iotaNamesClient } = useIotaNamesClient();
    return useQuery({
        queryKey: [...queryKey.coreConfig()],
        async queryFn() {
            return await iotaNamesClient.getCoreConfig();
        },
        enabled: !!iotaNamesClient,
        staleTime: 60 * 60 * 1000,
    });
}
