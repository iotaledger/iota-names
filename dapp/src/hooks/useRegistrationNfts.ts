// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import {
    getIotaNamesRegistrationType,
    getIotaSubdomainRegistrationType,
} from '@iota/iota-names-sdk';

import { useIotaNamesClient } from '@/contexts';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

export interface RegistrationNft {
    name: string;
    description?: string;
    image_url?: string;
    link?: string;
    project_url?: string;
}

type RegistrationNftType = 'domain' | 'subdomain';

export function useRegistrationNfts(type: RegistrationNftType = 'domain') {
    const { iotaNamesClient } = useIotaNamesClient();
    const account = useCurrentAccount();
    const address = account?.address ?? '';
    const packageId = iotaNamesClient.config.packageId;

    const filter = (() => {
        switch (type) {
            case 'domain':
                return {
                    StructType: getIotaNamesRegistrationType(packageId),
                };
            case 'subdomain':
                return {
                    StructType: getIotaSubdomainRegistrationType(packageId),
                };
        }
    })();

    return useGetAllOwnedObjects(address, filter, {
        select(data) {
            return data.map((nameRecord) => {
                const data = nameRecord?.display?.data;
                return {
                    name: data?.name ?? '',
                    description: data?.description,
                    image_url: data?.image_url,
                    link: data?.link,
                    project_url: data?.project_url,
                };
            });
        },
    });
}
