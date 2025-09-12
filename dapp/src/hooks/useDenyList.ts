// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

export function useReservedList() {
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        queryKey: [...queryKey.reservedList()],
        queryFn: async () => {
            return await iotaNamesClient.getRestrictedList('reserved');
        },
        staleTime: 60 * 60 * 1000, // Cache for 1 hour
        enabled: !!iotaNamesClient,
    });
}

export function useBlockedList() {
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        queryKey: [...queryKey.blockedList()],
        queryFn: async () => {
            return await iotaNamesClient.getRestrictedList('blocked');
        },
        staleTime: 60 * 60 * 1000, // Cache for 1 hour
        enabled: !!iotaNamesClient,
    });
}

export function useDenyList() {
    const reservedListQuery = useReservedList();
    const blockedListQuery = useBlockedList();

    const isNameWithBlockedWord = (name: string) => {
        const blockedList = blockedListQuery.data || [];
        return blockedList.some((blockedWord) => name.includes(blockedWord));
    };

    const isNameWithReservedWord = (name: string) => {
        const reservedList = reservedListQuery.data || [];
        return reservedList.some((reservedWord) => name.includes(reservedWord));
    };

    return {
        isNameWithBlockedWord,
        isNameWithReservedWord,
        reservedList: reservedListQuery.data || [],
        blockedList: blockedListQuery.data || [],
        isLoading: reservedListQuery.isLoading || blockedListQuery.isLoading,
        error: reservedListQuery.error || blockedListQuery.error,
    };
}
