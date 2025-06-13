// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/providers/contexts';

export function useGetSubnamePermissions(name: string) {
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        queryKey: ['get-permissions', 'iota-name', name],
        async queryFn() {
            const data = await iotaNamesClient.getNameRecord(name);
            const permissions = data?.data;
            if (permissions) {
                if ('S_AC' in permissions) {
                    permissions.allowChildCreation = String(permissions.S_AC === '1');
                }
                if ('S_ATE' in permissions) {
                    permissions.allowTimeExtension = String(permissions.S_ATE === '1');
                }
            }

            return permissions;
        },
        enabled: !!iotaNamesClient && !!name && name.length > 0,
    });
}
