// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType } from '@iota/apps-ui-kit';
import { useCurrentWallet, useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useEffect, useState } from 'react';

import { useIotaNamesClient } from '@/providers/contexts';

type PurchaseNameProps = {
    domainName: string;
    onClose: () => void;
};

export function PurchaseName({ domainName, onClose }: PurchaseNameProps) {
    const iotaClient = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    const { isConnected, currentWallet } = useCurrentWallet();
    const [price, setPrice] = useState<number | null>(null);
    const [isExecuted, setIsExecuted] = useState(false);
    const [digest, setDigest] = useState<string>();

    useEffect(() => {
        async function fetchPrice() {
            const length = domainName.split('.')[0].length;
            const total = await iotaNamesClient.getPriceList();
            for (const [[min, max], value] of total.entries()) {
                if (length >= min && length <= max) {
                    setPrice(value);
                    break;
                }
            }
        }
        fetchPrice().catch(console.error);
    }, [domainName, iotaNamesClient]);

    async function handlePurchase(domainName: string) {
        try {
            if (!currentWallet) {
                throw new Error('Wallet is not connected');
            }
            console.log('[Current wallet]: ', currentWallet);
            const address = currentWallet.accounts[0].address;
            if (!address) {
                throw new Error('Wallet address is undefined');
            }

            const domainLabels = domainName.split('.');
            if (domainName.split('.').length !== 2) {
                throw new Error('Subdomains not supported yet');
            }

            const length = domainLabels[0].length;
            if (length < 3) {
                throw new Error('Name too short (minimum 3 characters)');
            }

            const domainRegistered = await iotaNamesClient.getNameRecord(domainName);
            if (domainRegistered) {
                throw new Error('Domain name already registered');
            }

            // Build transaction
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
            if (price === null) {
                throw new Error('Price is not available');
            }
            const [coin] = iotaNamesTx.transaction.splitCoins(tx.gas, [price]);
            const nft = iotaNamesTx.register({
                domain: domainName!,
                years: 1,
                coin,
            });
            iotaNamesTx.transaction.transferObjects([nft], address);
            iotaNamesTx.transaction.transferObjects([coin], address);
            iotaNamesTx.transaction.setSender(address);
            const transaction = await iotaNamesTx.transaction.build({
                client: iotaClient,
            });

            //const signer = getSigner();
            // const executedTransactionResponse = await iotaClient.signAndExecuteTransaction({
            //     transaction,
            //     signer: signer,
            //     options: {
            //         showEffects: true,
            //         showObjectChanges: true,
            //     },
            // });

            const signAndExecuteTransaction =
                currentWallet.features['iota:signAndExecuteTransaction']?.signAndExecuteTransaction;

            if (!signAndExecuteTransaction) {
                throw new Error(
                    'signAndExecuteTransaction feature is not available in the current wallet',
                );
            }
            const executedTransactionResponse = await signAndExecuteTransaction({
                transaction: {
                    toJSON: async () => JSON.stringify(transaction),
                },
                account: currentWallet.accounts[0],
                chain: 'devnet:iota',
            });
            console.log('[Transaction digest]: ', executedTransactionResponse.digest);

            await iotaClient.waitForTransaction({
                digest: executedTransactionResponse.digest,
            });
            const transactionBlockResponse = await iotaClient.getTransactionBlock({
                digest: executedTransactionResponse.digest,
                options: {
                    showEffects: true,
                },
            });
            setDigest(executedTransactionResponse.digest);
            setIsExecuted(true);
            console.log('[Transaction block response]: ', transactionBlockResponse);
        } catch (error: unknown) {
            throw Error('Error purchasing domain name: ', error as Error);
        }
    }
    return (
        <div className="flex flex-col items-center w-full space-y-4">
            {isConnected && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                    }}
                >
                    <div className="relative bg-white/90 dark:bg-gray-800/90 p-8 rounded shadow-lg min-w-[350px] max-w-[90vw]">
                        <button
                            className="absolute top-4 right-4 text-xl font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white"
                            onClick={onClose}
                            aria-label="Close"
                            type="button"
                        >
                            ×
                        </button>{' '}
                        <div className="text-center font-bold text-lg mb-8">BUY NAME</div>
                        <div className="flex flex-col gap-6">
                            <div className="bg-gray-200/80 dark:bg-gray-700/80 p-4 rounded text-left">
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                    NAME
                                </div>
                                <div className="font-mono">{domainName}</div>
                            </div>
                            <div className="bg-gray-200/80 dark:bg-gray-700/80 p-4 rounded text-left">
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                    REGISTRATION TIME:
                                </div>
                                <div className="font-mono">{'1 YEAR'}</div>
                            </div>
                            <div className="bg-gray-200/80 dark:bg-gray-700/80 p-4 rounded text-left">
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                    PRICE
                                </div>
                                <div className="font-mono">{price ?? '-'}</div>
                            </div>
                            <Button
                                type={ButtonType.Primary}
                                text="BUY"
                                onClick={() => handlePurchase(domainName)}
                            />
                        </div>
                    </div>
                    {isExecuted && (
                        <div className="bg-gray-200/80 dark:bg-gray-700/80 p-4 rounded text-left">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                TX DIGEST
                            </div>
                            <div className="font-mono">{digest}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
