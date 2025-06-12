// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import { IotaObjectDataFilter } from '@iota/iota-sdk/client';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

export interface RegistrationNft {
    name: string;
    description?: string;
    image_url?: string;
    link?: string;
    project_url?: string;
}

export function useRegistrationNfts(filter: IotaObjectDataFilter) {
    const account = useCurrentAccount();
    const address = account?.address ?? '';

    const { data: namesRegistrationData } = useGetAllOwnedObjects(address, filter);

    const registrationNfts: RegistrationNft[] =
        namesRegistrationData?.map((nameRecord) => {
            const data = nameRecord?.display?.data;
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
