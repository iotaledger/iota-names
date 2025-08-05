// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

const PAYMENT_AUTH_ID = 'payments';
const PAYMENTH_AUTH = 'PaymentsAuth';

const AUCTION_AUTH_ID = 'auction';
const AUCTION_AUTH = 'AuctionAuth';

export function useNamesPurchaseMode() {
    const { iotaNamesClient } = useIotaNamesClient();
    const iotaClient = useIotaClient();

    const authKeyType = `${iotaNamesClient.config.packageId}::iota_names::AuthKey`;

    const paymentType = `${authKeyType}<${iotaNamesClient.config.paymentsPackageId}::${PAYMENT_AUTH_ID}::${PAYMENTH_AUTH}>`;
    const auctionType = `${authKeyType}<${iotaNamesClient.config.auctionPackageId}::${AUCTION_AUTH_ID}::${AUCTION_AUTH}>`;

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: queryKey.purchaseConfig(paymentType, auctionType),
        queryFn: async () => {
            if (!iotaNamesClient || !iotaClient) {
                return null;
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
    });
}
