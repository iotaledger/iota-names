// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { ALLOWED_METADATA, IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction, TransactionObjectArgument } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

interface UseUpdateNameTransactionOptions {
    address: string;
    name: string;
    nft: TransactionObjectArgument | string;
    isExpired: boolean;

    updates: NameUpdate[];
}

export type NameUpdate =
    | {
          type: 'set-avatar';
          nftId: string;
      }
    | {
          type: 'set-target-address';
          address: string;
          isSubname: boolean;
      }
    | {
          type: 'set-default';
          name: string;
      }
    | {
          type: 'unset-default';
      };

export function useUpdateNameTransaction({
    address,
    name,
    nft,
    isExpired,
    updates,
}: UseUpdateNameTransactionOptions) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.updateName(name, address), nft, updates],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

            for (const update of updates) {
                switch (update.type) {
                    case 'set-avatar':
                        iotaNamesTx.setUserData({
                            nft,
                            key: ALLOWED_METADATA.avatar,
                            value: update.nftId,
                        });
                        break;
                    case 'set-target-address':
                        iotaNamesTx.setTargetAddress({
                            nft,
                            address: update.address,
                            isSubname: update.isSubname,
                        });
                        break;
                    case 'set-default':
                        iotaNamesTx.setDefault(update.name);
                        break;
                    case 'unset-default':
                        iotaNamesTx.unsetDefault();
                        break;
                }
            }

            iotaNamesTx.transaction.setSender(address);
            await iotaNamesTx.transaction.build({
                client,
            });
            return iotaNamesTx.transaction;
        },
        enabled: !!address && !!updates.length && !!name && name.length > 0 && !isExpired,
        gcTime: 0,
    });
}
