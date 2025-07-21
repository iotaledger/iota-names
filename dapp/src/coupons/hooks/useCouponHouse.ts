// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { fromB64 } from '@iota/iota-sdk/utils';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { CouponHouseBcs, DummyFieldBcs } from '../lib/types';

const DUMMY_FIELD_B64 = DummyFieldBcs.serialize({ dummy_field: false }).toBase64();

interface CouponHouseData {
    couponsTableId: string;
}

export function useCouponHouse(): UseQueryResult<CouponHouseData | null, Error> {
    const { iotaNamesClient } = useIotaNamesClient();

    const iotaNamesObjectId = iotaNamesClient.config.iotaNamesObjectId;
    const packageId = iotaNamesClient.config.packageId;
    const couponsPackageId = iotaNamesClient.config.couponsPackageId;

    return useQuery({
        queryKey: ['couponHouse', iotaNamesObjectId, packageId, couponsPackageId],
        queryFn: async () => {
            const couponHouseResponse = await iotaNamesClient.graphQlClient.query<{
                owner: { dynamicField: { value: { bcs: string } } };
            }>({
                query: graphql(`
                    query getIotaNamesCouponHouseRegistryKey(
                        $parentId: IotaAddress!
                        $name: DynamicFieldName!
                    ) {
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
                    parentId: iotaNamesObjectId,
                    name: {
                        type: `${packageId}::iota_names::RegistryKey<${couponsPackageId}::coupon_house::CouponHouse>`,
                        bcs: DUMMY_FIELD_B64,
                    },
                },
            });

            return couponHouseResponse.data;
        },
        select: (data) => {
            const couponsHouseDynamicFieldValue = data?.owner?.dynamicField?.value;
            const couponHouseBcsB64 = couponsHouseDynamicFieldValue?.bcs;

            if (!couponsHouseDynamicFieldValue || !couponHouseBcsB64) {
                return null;
            }

            const couponHouse = CouponHouseBcs.parse(fromB64(couponHouseBcsB64));

            return {
                couponsTableId: couponHouse.coupons.coupons.id,
            };
        },
    });
}
