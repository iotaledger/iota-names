// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { useCurrentAccount } from '@iota/dapp-kit';
import {
    getIotaNamesRegistrationType,
    getIotaSubnameRegistrationType,
    isSubname,
} from '@iota/iota-names-sdk';
import { IotaParsedData } from '@iota/iota-sdk/client';

import { useIotaNamesClient } from '@/contexts';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

type RegistrationNftType = 'name' | 'subname';
export function useRegistrationNfts(type: RegistrationNftType = 'name') {
    const { iotaNamesClient } = useIotaNamesClient();
    const account = useCurrentAccount();
    const address = account?.address ?? '';
    const packageId = iotaNamesClient.config.packageId;
    const filter = (() => {
        switch (type) {
            case 'name':
                return {
                    StructType: getIotaNamesRegistrationType(packageId),
                };
            case 'subname':
                return {
                    StructType: getIotaSubnameRegistrationType(packageId),
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
                const isNameSubname = isSubname(data?.name || '');
                type NameFields = undefined | { expiration_timestamp_ms?: string };
                const fields = isNameSubname
                    ? (content?.fields as { nft: { fields: NameFields } }).nft.fields
                    : (content?.fields as NameFields);
                return {
                    name: data?.name ?? '',
                    description: data?.description,
                    imageUrl: data?.image_url,
                    link: data?.link,
                    projectUrl: data?.project_url,
                    isExpired:
                        !!fields?.expiration_timestamp_ms &&
                        Number(fields?.expiration_timestamp_ms) < Date.now(),
                    expirationTimestampMs: Number(fields?.expiration_timestamp_ms ?? ''),
                    id: nameRecord.objectId,
                    isSubname: type === 'subname',
                } satisfies RegistrationNft;
            });
        },
    });
}
