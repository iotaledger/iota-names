// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { type IotaObjectData } from '@iota/iota-sdk/client';
import { useMemo } from 'react';

import { isKioskOwnerToken } from '@/lib/utils/kiosk';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';
import { useKioskClient } from './useKioskClient';

const FILTER_NONE_STRUCT_TYPES = [
    '0x2::coin::Coin',
    '0x3::staking_pool::StakedIota',
    '0x2::iota::IOTA',
    '0x3::timelocked_staking::TimelockedStakedIota',
    '0x2::timelock::TimeLock<0x2::balance::Balance<0x2::iota::IOTA>>',
];

export function useGetVisualAssets(address: string) {
    const kioskClient = useKioskClient();

    const { data: ownedObjects, ...ownedObjectsQuery } = useGetAllOwnedObjects(address, {
        MatchNone: FILTER_NONE_STRUCT_TYPES.map((type) => ({
            StructType: type,
        })),
    });

    const visualAssets = useMemo(() => {
        const visualAssets = ownedObjects?.filter((obj) => !!obj.display?.data) ?? [];

        const kioskAssets =
            ownedObjects?.reduce((acc, curr) => {
                if (isKioskOwnerToken(kioskClient.network, curr)) acc.push(curr);
                return acc;
            }, [] as IotaObjectData[]) ?? [];

        return [...visualAssets, ...kioskAssets];
    }, [ownedObjects]);

    return {
        data: visualAssets,
        ...ownedObjectsQuery,
    };
}
