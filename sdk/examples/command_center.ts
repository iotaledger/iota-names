// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getNetwork, IotaClient } from '@iota/iota-sdk/client';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction, TransactionObjectArgument } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { IotaNamesClient } from '../src/iota-names-client.js';
import { IotaNamesTransaction } from '../src/iota-names-transaction.js';
import { isValidIotaName } from '../src/utils.js';

const cmd = process.argv[2];
const domain = process.argv[3] || 'rustisbetterthanjs.iota';

(async () => {
    if (!isValidIotaName(domain)) {
        throw new Error('Invalid iota name domain!');
    }

    const keypair = Ed25519Keypair.deriveKeypair(
        'snack oxygen shallow fatigue hard retire trick ginger legend belt gain behind wreck apart wise board cat leaf fresh unit muffin flavor sure equal',
    );
    const address = keypair.toIotaAddress();

    const { url, faucet } = getNetwork('devnet');
    const graphql = 'https://graphql.devnet.iota.cafe'; // TODO: @iota/iota-sdk does not bundle any graphql endpoint atm

    const iotaClient = new IotaClient({
        url,
    });

    const iotaNamesClient = new IotaNamesClient({
        client: iotaClient,
        network: 'devnet',
    });

    console.log('[Domain]:', domain);
    console.log('[Secret key]:', keypair.getSecretKey());
    console.log('[Address]:', address);

    switch (cmd) {
        case 'bid':
            {
                const bidAmount = 1n * NANOS_PER_IOTA;

                const auctionHouse = await getAuctionHouse(iotaNamesClient, graphql!);

                const tx = new Transaction();
                const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

                const bid = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                    bidAmount,
                ]);

                await startAuctionAndPlaceBid(iotaNamesTx, auctionHouse, domain, bid);

                iotaNamesTx.transaction.setSender(address);

                const transaction = await iotaNamesTx.transaction.build({
                    client: iotaClient,
                });

                const executedTransactionResponse = await iotaClient.signAndExecuteTransaction({
                    transaction,
                    signer: keypair,
                });

                console.log('[Transaction digest]:', executedTransactionResponse.digest);

                await iotaClient.waitForTransaction({
                    digest: executedTransactionResponse.digest,
                });

                const transactionBlockResponse = await iotaClient.getTransactionBlock({
                    digest: executedTransactionResponse.digest,
                    options: {
                        showEffects: true,
                    },
                });

                console.log(transactionBlockResponse);
            }
            break;

        case 'check-own': {
            console.log(
                '[Domain Record (null if available)]: ',
                await iotaNamesClient.getNameRecord(domain),
            );

            break;
        }

        case 'create': {
            await requestIotaFromFaucetV0({
                host: faucet!,
                recipient: address,
            });

            console.log('[Faucet]: Received funds');

            console.log(
                '[Domain Record (null if available)]: ',
                await iotaNamesClient.getNameRecord(domain),
            );

            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
            const [coin] = iotaNamesTx.transaction.splitCoins(tx.gas, [100_000_000]);

            const nft = iotaNamesTx.register({
                domain,
                years: 1,
                coin,
            });

            iotaNamesTx.transaction.transferObjects([nft], address);

            iotaNamesTx.transaction.transferObjects([coin], address);

            iotaNamesTx.transaction.setSender(address);

            const transaction = await iotaNamesTx.transaction.build({
                client: iotaClient,
            });

            const executedTransactionResponse = await iotaClient.signAndExecuteTransaction({
                transaction,
                signer: keypair,
            });

            console.log('[Transaction digest]:', executedTransactionResponse.digest);

            await iotaClient.waitForTransaction({
                digest: executedTransactionResponse.digest,
            });

            const transactionBlockResponse = await iotaClient.getTransactionBlock({
                digest: executedTransactionResponse.digest,
                options: {
                    showEffects: true,
                },
            });

            console.log('[Transaction response]:', transactionBlockResponse);
            console.log(`[IotaNames]: You own '${domain}'`);

            break;
        }
    }
})();

// Based on https://github.com/iotaledger/iota/blob/bd0496c28a5ed0e0c264aa70bfe5da5c653756fc/crates/iota/src/name_commands.rs#L1543-L1544
async function getAuctionHouse(
    iotaNamesClient: IotaNamesClient,
    graphqlUrl: string,
): Promise<string> {
    const config = iotaNamesClient.config;

    const graphqlClient = new IotaGraphQLClient({
        url: graphqlUrl,
    });

    const response = await graphqlClient.query<any>({
        query: graphql(`
            query getActionHouse($type: String!) {
                objects(filter: { type: $type }) {
                    edges {
                        node {
                            address
                        }
                    }
                }
            }
        `),
        variables: {
            type: `${config.auctionPackageId}::auction::AuctionHouse`,
        },
    });

    return response.data['objects']['edges'][0]?.node?.address || null;
}

async function startAuctionAndPlaceBid(
    iotaNamesTx: IotaNamesTransaction,
    auctionHouse: string,
    domain: string,
    coin: TransactionObjectArgument,
): Promise<void> {
    const transaction = iotaNamesTx.transaction;
    const config = iotaNamesTx.iotaNamesClient.config;

    transaction.moveCall({
        target: `${config.auctionPackageId}::auction::start_auction_and_place_bid`,
        arguments: [
            transaction.object(auctionHouse),
            transaction.object(config.iotaNames),
            transaction.pure.string(domain),
            coin,
            transaction.object('0x06'),
        ],
    });
}
