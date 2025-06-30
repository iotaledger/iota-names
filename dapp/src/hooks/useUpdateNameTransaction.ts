// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { ALLOWED_METADATA, IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

interface UseUpdateNameTransactionOptions {
    address: string;
    name: string;
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
          nftId: string;
      }
    | {
          type: 'set-default';
          name: string;
      }
    | {
          type: 'unset-default';
      }
    | {
          type: 'edit-setup';
          parentNftId: string;
          name: string;
          allowChildCreation: boolean;
          allowTimeExtension: boolean;
      }
    | {
          type: 'delete-name';
          nft: string;
          isSubname: boolean;
      }
    | {
          type: 'new-subdomain';
          parentNftId: string;
          subdomainName: string;
          expirationTimeParent: number;
          allowChildCreation: boolean;
          allowTimeExtension: boolean;
      };

export function useUpdateNameTransaction({
    address,
    name,
    isExpired,
    updates,
}: UseUpdateNameTransactionOptions) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.updateName(name, address), updates],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

            for (const update of updates) {
                switch (update.type) {
                    case 'set-avatar':
                        iotaNamesTx.setUserData({
                            nft: update.nftId,
                            key: ALLOWED_METADATA.avatar,
                            value: update.nftId,
                        });
                        break;
                    case 'set-target-address':
                        iotaNamesTx.setTargetAddress({
                            nft: update.nftId,
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
                    case 'edit-setup':
                        iotaNamesTx.editSetup({
                            parentNft: tx.object(update.parentNftId),
                            name,
                            allowChildCreation: update.allowChildCreation,
                            allowTimeExtension: update.allowTimeExtension,
                        });
                        break;
                    case 'new-subdomain':
                        const subnameNft = iotaNamesTx.createSubName({
                            parentNft: tx.object(update.parentNftId),
                            name: update.subdomainName,
                            expirationTimestampMs: update.expirationTimeParent,
                            allowChildCreation: update.allowChildCreation,
                            allowTimeExtension: update.allowTimeExtension,
                        });
                        iotaNamesTx.transaction.transferObjects([subnameNft], address);
                        break;
                    case 'delete-name':
                        iotaNamesTx.burnExpired({
                            nft: tx.object(update.nft),
                            isSubname: update.isSubname,
                        });
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
