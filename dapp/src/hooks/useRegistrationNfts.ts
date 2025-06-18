// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import {
    getIotaNamesRegistrationType,
    getIotaSubdomainRegistrationType,
} from '@iota/iota-names-sdk';
import { IotaObjectData } from '@iota/iota-sdk/client';
import { useMemo } from 'react';

import { useIotaNamesClient } from '@/contexts';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

export interface RegistrationNft {
    name: string;
    description?: string;
    image_url?: string;
    link?: string;
    project_url?: string;
    expiration_timestamp_ms?: number;
    isExpired?: boolean;
}

type RegistrationNftType = 'domain' | 'subdomain';

type DomainContent = {
    dataType: 'moveObject';
    fields?: { expiration_timestamp_ms?: string };
};

type SubdomainContent = {
    dataType: 'moveObject';
    fields?: { nft?: { fields?: { expiration_timestamp_ms?: string } } };
};

export function useRegistrationNfts(type: RegistrationNftType = 'domain') {
    const account = useCurrentAccount();
    const { iotaNamesClient } = useIotaNamesClient();
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

    const getExpirationTimestamp = useMemo(() => {
        if (type === 'domain') {
            return (object: IotaObjectData): number | undefined => {
                const domainContent = object.content as DomainContent;
                return domainContent.fields?.expiration_timestamp_ms
                    ? Number(domainContent.fields.expiration_timestamp_ms)
                    : undefined;
            };
        }

        return (object: IotaObjectData): number | undefined => {
            const subdomainContent = object.content as SubdomainContent;
            return subdomainContent.fields?.nft?.fields?.expiration_timestamp_ms
                ? Number(subdomainContent.fields.nft.fields.expiration_timestamp_ms)
                : undefined;
        };
    }, [type]);

    return useGetAllOwnedObjects(address, filter, {
        select(data) {
            return data.map((nameRecord) => {
                const data = nameRecord?.display?.data;
                const expirationTimestamp = getExpirationTimestamp(nameRecord);
                return {
                    name: data?.name ?? '',
                    description: data?.description,
                    image_url: data?.image_url,
                    link: data?.link,
                    project_url: data?.project_url,
                    expiration_timestamp_ms: expirationTimestamp,
                    isExpired: !!expirationTimestamp && expirationTimestamp < Date.now(),
                } satisfies RegistrationNft;
            });
        },
    });
}
