// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { getYearsToRenew, isNameRenewable } from '@/lib/utils/names';

export function useRenewData(expirationTimestampMs: number, renewYears: number) {
    const { iotaNamesClient } = useIotaNamesClient();
    return useQuery({
        queryKey: [expirationTimestampMs, renewYears],
        async queryFn() {
            const max_years = (await iotaNamesClient.getCoreConfig()).max_years;
            const isRenewable = isNameRenewable(max_years, expirationTimestampMs, renewYears);
            const yearsToRenew = getYearsToRenew(max_years, expirationTimestampMs);
            return {
                isRenewable,
                yearsToRenew,
            };
        },
        enabled: !!iotaNamesClient,
    });
}
