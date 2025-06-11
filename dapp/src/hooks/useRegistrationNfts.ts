// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import { getIotaNamesRegistrationType } from '@iota/iota-names-sdk';

import { useIotaNamesClient } from '@/providers/contexts';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

export interface RegistrationNft {
    name: string;
    description?: string;
    image_url?: string;
    link?: string;
    project_url?: string;
    expiration_timestamp_ms: number;
    id: string;
    isAllowRenew?: boolean; // subdomains
    isAllowSubdomains?: boolean; //subdomains
}

export function useRegistrationNfts() {
    const account = useCurrentAccount();
    const address = account?.address ?? '';

    const { iotaNamesClient } = useIotaNamesClient();
    const packageId = iotaNamesClient.config.packageId;

    const { data: namesRegistrationData } = useGetAllOwnedObjects(address, {
        StructType: getIotaNamesRegistrationType(packageId),
    });

    const registrationNfts: RegistrationNft[] =
        namesRegistrationData?.map((nameRecord) => {
            const data = nameRecord?.display?.data;
            const fields = nameRecord?.content?.fields;
            return {
                name: data?.name ?? '',
                description: data?.description,
                image_url: data?.image_url,
                link: data?.link,
                project_url: data?.project_url,
                expiration_timestamp_ms: fields?.expiration_timestamp_ms,
                id: nameRecord?.objectId,
                isAllowRenew: false,
                isAllowSubdomains: false,
            };
        }) ?? [];

    return registrationNfts;
}
