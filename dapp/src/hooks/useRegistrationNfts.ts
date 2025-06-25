// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { useCurrentAccount } from '@iota/dapp-kit';
import {
    getIotaNamesRegistrationType,
    getIotaSubdomainRegistrationType,
} from '@iota/iota-names-sdk';
import { IotaParsedData } from '@iota/iota-sdk/client';

import { useIotaNamesClient } from '@/contexts';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

export interface RegistrationNft {
    name: string;
    description?: string;
    image_url?: string;
    link?: string;
    project_url?: string;
    expiration_timestamp_ms: number;
    id: string;
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
                const content = nameRecord.content as
                    | Extract<IotaParsedData, { dataType: 'moveObject' }>
                    | undefined
                    | null;
                const fields = content?.fields as { expiration_timestamp_ms?: string } | undefined;
                return {
                    name: data?.name ?? '',
                    description: data?.description,
                    image_url: data?.image_url,
                    link: data?.link,
                    project_url: data?.project_url,
                    expiration_timestamp_ms: Number(fields?.expiration_timestamp_ms ?? ''),
                    id: nameRecord.objectId,
                };
            });
        },
    });
}
