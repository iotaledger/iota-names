// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

export function useNamesPurchaseMode() {
    const { iotaNamesClient } = useIotaNamesClient();
    const iotaClient = useIotaClient();
    const packageId = iotaNamesClient.resolvePackageId('v1');

    const authKeyType = `${packageId}::iota_names::AuthKey`;

    const paymentType = `${authKeyType}<${iotaNamesClient.config.paymentsPackageId}::payments::PaymentsAuth>`;
    const auctionType = `${authKeyType}<${iotaNamesClient.config.auctionPackageId}::auction::AuctionAuth>`;

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.purchaseConfig(paymentType, auctionType)],
        queryFn: async () => {
            if (!iotaNamesClient || !iotaClient) {
                throw new Error('Missing clients');
            }

            const { data: dynamicFields } = await iotaClient.getDynamicFields({
                parentId: iotaNamesClient.config.iotaNamesObjectId,
            });

            const fieldTypes = dynamicFields.map((field) => field.name.type);

            return {
                isPaymentAuthorized: fieldTypes.includes(paymentType),
                isAuctionAuthorized: fieldTypes.includes(auctionType),
            };
        },
        enabled: !!iotaNamesClient && !!iotaClient,
        staleTime: 10 * 60 * 1000,
        placeholderData: {
            isPaymentAuthorized: false,
            isAuctionAuthorized: false,
        },
    });
}
