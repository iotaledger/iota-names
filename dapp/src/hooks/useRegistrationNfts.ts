// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import { getIotaNamesRegistrationType } from '@iota/iota-names-sdk';
import { IotaParsedData } from '@iota/iota-sdk/client';

import { useIotaNamesClient } from '@/providers/contexts';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

interface RegistrationNft {
    name: string;
    description?: string;
    image_url?: string;
    link?: string;
    project_url?: string;
    expiration_timestamp_ms: number;
    id: string;
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
            const data = nameRecord.display?.data;
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
                id: nameRecord?.objectId ?? '',
            };
        }) ?? [];

    return registrationNfts;
}
