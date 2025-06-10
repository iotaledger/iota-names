// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import { getIotaNamesRegistrationType } from '@iota/iota-names-sdk';

import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';
import { useIotaNamesClient } from '@/providers/contexts';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

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

            const expirationTimestampMsValue =
                nameRecord.content &&
                'fields' in nameRecord.content &&
                'expiration_timestamp_ms' in nameRecord.content.fields
                    ? nameRecord.content.fields.expiration_timestamp_ms
                    : undefined;

            const expirationTimestampMs = Number.isNaN(Number(expirationTimestampMsValue))
                ? undefined
                : Number(expirationTimestampMsValue);

            return {
                name: data?.name ?? '',
                description: data?.description,
                image_url: data?.image_url,
                link: data?.link,
                project_url: data?.project_url,
                objectId: nameRecord.objectId,
                expiration_timestamp_ms: expirationTimestampMs,
            };
        }) ?? [];

    return registrationNfts;
}
