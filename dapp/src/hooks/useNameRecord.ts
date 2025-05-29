import { isValidIotaName, NameRecord } from '@iota/iota-names-sdk';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/providers/contexts';

type PriceOption = {
    years: number;
    isRegistration: boolean;
};

type UseNameRecordOptions = {
    price?: PriceOption;
};

type NameRecordData =
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

    return useQuery({
        queryKey: ['name-record', name, price],
        async queryFn() {
            if (!isValidIotaName(name)) {
                throw new Error('Name is not valid.');
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
        enabled: !!iotaNamesClient && name.length > 0,
    });
}
