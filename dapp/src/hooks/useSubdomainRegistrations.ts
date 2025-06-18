// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import { getIotaSubdomainRegistrationType } from '@iota/iota-names-sdk';

import { useIotaNamesClient } from '@/providers/contexts';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

interface RegistrationNft {
    name: string;
    description?: string;
    image_url?: string;
    link?: string;
    project_url?: string;
}

export function useSubdomainRegistrations() {
    const account = useCurrentAccount();
    const address = account?.address ?? '';

    const { iotaNamesClient } = useIotaNamesClient();
    const packageId = iotaNamesClient.config.packageId;

    const { data: ownedObjects } = useGetAllOwnedObjects(address, {
        StructType: getIotaSubdomainRegistrationType(packageId),
    });

    const registrationNfts: RegistrationNft[] =
        ownedObjects?.map((obj) => {
            const data = obj?.display?.data;
            return {
                name: data?.name ?? '',
                description: data?.description,
                image_url: data?.image_url,
                link: data?.link,
                project_url: data?.project_url,
            };
        }) ?? [];

    return registrationNfts;
}
