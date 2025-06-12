// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { type IotaObjectData } from '@iota/iota-sdk/client';
import { useMemo } from 'react';

import { isKioskOwnerToken } from '@/lib/utils/kiosk';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';
import { useKioskClient } from './useKioskClient';

export function useGetVisualAssets(address: string) {
    const kioskClient = useKioskClient();

    const { data: ownedObjects, ...ownedObjectsQuery } = useGetAllOwnedObjects(address, {
        MatchNone: [{ StructType: '0x2::coin::Coin' }],
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
