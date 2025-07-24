// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { ALLOWED_METADATA, IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { getGasSummary } from '@/lib/utils/getGasSummary';

import { queryKey } from './queryKey';

interface UseUpdateNameTransactionOptions {
    address: string;
    updates: NameUpdate[];
}

export type NameUpdate =
    | {
          type: 'set-avatar';
          nftId: string;
          avatarNftId: string;
          isSubname?: boolean;
      }
    | {
          type: 'set-target-address';
          address: string | undefined;
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
          name: string;
          parentNftId: string;
          allowChildCreation: boolean;
          allowTimeExtension: boolean;
      }
    | {
          type: 'new-subname';
          parentNftId: string;
          subname: string;
          expirationTimeParent: number;
          allowChildCreation: boolean;
          allowTimeExtension: boolean;
      }
    | {
          type: 'delete-name';
          nft: string;
          isSubname: boolean;
      }
    | {
          type: 'renew-name';
          name: string;
          nftId: string;
          years: number;
      }
    | {
          type: 'renew-subname';
          nftId: string;
          expirationTimestampMs: number;
      }
    | {
          type: 'register-name';
          name: string;
          price: number;
          years: number;
          setDefault: boolean;
      };

export function useUpdateNameTransaction({ address, updates }: UseUpdateNameTransactionOptions) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.updateName(address), updates],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

            for (const update of updates) {
                switch (update.type) {
                    case 'set-avatar':
                        iotaNamesTx.setUserData({
                            nft: update.nftId,
                            key: ALLOWED_METADATA.avatar,
                            value: update.avatarNftId,
                            isSubname: update.isSubname,
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
                            name: update.name,
                            allowChildCreation: update.allowChildCreation,
                            allowTimeExtension: update.allowTimeExtension,
                        });
                        break;
                    case 'new-subname':
                        const subnameNft = iotaNamesTx.createSubname({
                            parentNft: tx.object(update.parentNftId),
                            name: update.subname,
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
                    case 'renew-name':
                        await iotaNamesTx.renew({
                            nft: update.nftId,
                            name: update.name,
                            years: update.years,
                            coin: tx.gas,
                        });
                        break;
                    case 'renew-subname':
                        iotaNamesTx.extendExpiration({
                            nft: update.nftId,
                            expirationTimestampMs: update.expirationTimestampMs,
                        });
                        break;
                    case 'register-name':
                        const [coin] = iotaNamesTx.transaction.splitCoins(tx.gas, [update.price]);
                        const nft = await iotaNamesTx.register({
                            name: update.name,
                            years: update.years,
                            coin,
                        });
                        if (update.setDefault) {
                            iotaNamesTx.setTargetAddress({
                                nft: nft,
                                address: address,
                                isSubname: false,
                            });
                            iotaNamesTx.setDefault(update.name);
                        }
                        iotaNamesTx.transaction.transferObjects([nft, coin], address);
                        break;
                }
            }

            iotaNamesTx.transaction.setSender(address);
            const transaction = await iotaNamesTx.transaction.build({
                client,
            });
            const txDryRun = await client.dryRunTransactionBlock({
                transactionBlock: transaction,
            });
            return {
                transaction: iotaNamesTx.transaction,
                builtTx: transaction,
                txDryRun,
            };
        },
        enabled: !!address && !!updates.length,
        gcTime: 0,
        select: ({ transaction, txDryRun, builtTx }) => {
            return {
                transaction,
                gasSummary: getGasSummary(txDryRun),
                builtTx,
            };
        },
    });
}
