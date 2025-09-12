// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { NameRecord, validateIotaName } from '@iota/iota-names-sdk';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { FORBIDDEN_LIST } from '@/lib/constants/forbiddenList';

import { queryKey } from './queryKey';
import { useDenyList } from './useDenyList';

type PriceOption = {
    years: number;
    isRegistration: boolean;
};

type UseNameRecordOptions = {
    price?: PriceOption;
};

export type NameRecordData =
    | {
          type: 'unavailable';
          nameRecord: NameRecord;
      }
    | {
          type: 'available';
          price: number;
      }
    | {
          // Not priced because of being too short
          type: 'not-priced';
      }
    | {
          type: 'reserved';
      }
    | {
          type: 'blocked';
      };

const DEFAULT_PRICE_OPTION = {
    years: 1,
    isRegistration: true,
};

export function useNameRecord(
    name: string,
    { price = DEFAULT_PRICE_OPTION }: UseNameRecordOptions = {},
) {
    const { iotaNamesClient } = useIotaNamesClient();
    const { reservedList, blockedList } = useDenyList();

    const isNameReserved = reservedList.some((label) => name.includes(label));
    const isNameBlocked = blockedList.some((label) => name.includes(label));
    return useQuery({
        queryKey: [...queryKey.nameRecord(name), price, isNameReserved, isNameBlocked],
        async queryFn() {
            const validationError = validateIotaName(name);
            if (validationError) {
                throw new Error(validationError);
            }

            if (isNameReserved || isNameBlocked) {
                return {
                    nameRecord: null,
                    isReserved: isNameReserved,
                    isBlocked: isNameBlocked,
                };
            }

            if (FORBIDDEN_LIST.some((word) => name.includes(word))) {
                return {
                    nameRecord: null,
                };
            }

            const nameRecord = await iotaNamesClient.getNameRecord(name);
            let nameRecordPrice = null;

            if (!nameRecord) {
                nameRecordPrice = await iotaNamesClient.calculatePrice({
                    name,
                    years: price.years,
                    isRegistration: price.isRegistration,
                });
            }

            return {
                nameRecord,
                price: nameRecordPrice,
            };
        },
        select(data) {
            if (data.nameRecord) {
                return {
                    type: 'unavailable',
                    ...data,
                } as NameRecordData;
            } else if (data.isReserved) {
                return {
                    type: 'reserved',
                } as NameRecordData;
            } else if (data.isBlocked) {
                return {
                    type: 'blocked',
                } as NameRecordData;
            } else if (data.price) {
                return {
                    type: 'available',
                    ...data,
                } as NameRecordData;
            } else {
                return {
                    type: 'not-priced',
                } as NameRecordData;
            }
        },
        enabled:
            !!iotaNamesClient &&
            name.length > 0 &&
            reservedList !== undefined &&
            blockedList !== undefined,
    });
}
