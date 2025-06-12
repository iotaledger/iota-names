// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { isSubName, isValidIotaName } from '@iota/iota-names-sdk';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/providers/contexts';

export function useSubnameRecord(subname: string) {
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        queryKey: ['name-record', subname],
        async queryFn() {
            if (!isValidIotaName(subname)) {
                throw new Error('Subname is not valid.');
            }
            if (!isSubName(subname)) {
                throw new Error('Is not a subname.');
            }
            const nameRecord = await iotaNamesClient.getNameRecord(subname);

            return {
                nameRecord,
            };
        },
        select(data) {
            return data.nameRecord === null;
        },
        enabled: !!iotaNamesClient && subname.length > 0,
    });
}
