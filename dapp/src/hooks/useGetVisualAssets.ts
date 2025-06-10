// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { type IotaObjectData } from '@iota/iota-sdk/client';
import { useMemo } from 'react';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

const COIN_TYPE = '0x2::coin::Coin';

export function useGetVisualAssets(address: string) {
    const { data, ...objectsQuery } = useGetAllOwnedObjects(address, {
        MatchNone: [{ StructType: COIN_TYPE }],
    });

    const assets = useMemo(() => {
        const visualAssets =
            data?.reduce((accumulatedAssets, currentObject) => {
                const hasDisplay = !!currentObject?.display?.data;
                return [...accumulatedAssets, ...(hasDisplay ? [currentObject] : [])];
            }, [] as IotaObjectData[]) || ([] as IotaObjectData[]);

        return visualAssets;
    }, [data]);

    return {
        data: assets,
        ...objectsQuery,
    };
}
