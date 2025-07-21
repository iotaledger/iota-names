// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { fromB64 } from '@iota/iota-sdk/utils';
import { blake2b } from '@noble/hashes/blake2';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { CouponBcs } from '../lib/types';
import { useCouponHouse } from './useCouponHouse';

export function useResolveCoupon(couponKey: string) {
    const { iotaNamesClient } = useIotaNamesClient();
    const { data: couponHouseData } = useCouponHouse();

    const couponsTableId = couponHouseData?.couponsTableId;

    return useQuery({
        queryKey: ['resolveCoupon', couponKey, couponsTableId],
        queryFn: async () => {
            if (!couponsTableId) {
                return null;
            }

            const couponKeyHash = bytesToHex(blake2b(couponKey, { dkLen: 32 }));
            const couponKeyBytes = hexToBytes(couponKeyHash);

            const keyBcs = bcs.vector(bcs.u8()).serialize(couponKeyBytes).toBase64();

            const couponResponse = await iotaNamesClient.graphQlClient.query<{
                owner: { dynamicField: { value: { bcs: string } } };
            }>({
                query: graphql(`
                    query getCouponBcs($parentId: IotaAddress!, $name: DynamicFieldName!) {
                        owner(address: $parentId) {
                            dynamicField(name: $name) {
                                value {
                                    ... on MoveValue {
                                        bcs
                                    }
                                }
                            }
                        }
                    }
                `),
                variables: {
                    parentId: couponsTableId,
                    name: {
                        type: 'vector<u8>',
                        bcs: keyBcs,
                    },
                },
            });

            return couponResponse.data;
        },
        select: (data) => {
            const couponBcsBase64 = data?.owner?.dynamicField?.value?.bcs;

            if (!couponBcsBase64) {
                return null;
            }

            const coupon = CouponBcs.parse(fromB64(couponBcsBase64));

            return coupon;
        },
    });
}
