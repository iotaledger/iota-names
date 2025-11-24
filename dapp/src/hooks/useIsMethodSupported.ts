// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

export function useIsMethodSupported({
    packageId,
    module,
    functionName,
}: {
    packageId: string;
    module: string;
    functionName: string;
}) {
    const { iotaNamesClient } = useIotaNamesClient();
    return useQuery({
        queryKey: [...queryKey.methodSupported(packageId, module, functionName)],
        queryFn() {
            return iotaNamesClient.isMethodSupported(packageId, module, functionName);
        },
    });
}
