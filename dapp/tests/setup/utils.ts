// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import 'dotenv/config';

import { exec } from 'child_process';
import { IotaClientGraphQLTransport } from '@iota/graphql-transport';
import { IotaNamesClient } from '@iota/iota-names-sdk';
import { getNetwork, IotaClient } from '@iota/iota-sdk/client';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';

const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_NAMES_DAPP_DEFAULT_NETWORK as string;

if (!DEFAULT_NETWORK) {
    throw new Error(
        'NEXT_PUBLIC_NAMES_DAPP_DEFAULT_NETWORK is not defined in the environment variables',
    );
}

const NETWORK_CONFIG = getNetwork(DEFAULT_NETWORK);

const iotaClient = new IotaClient({
    transport: new IotaClientGraphQLTransport({
        url: NETWORK_CONFIG.graphql!,
    }),
});

const iotaNamesClient = new IotaNamesClient({
    graphQlClient: new IotaGraphQLClient({
        url: NETWORK_CONFIG.graphql!,
    }),
    network: NETWORK_CONFIG.id,
});

if (!iotaNamesClient.config) {
    throw new Error('IOTA Names Client Config is not properly configured');
}

const authKeyType = `${iotaNamesClient.config.packageId}::iota_names::AuthKey`;

const PAYMENT_TYPE = `${authKeyType}<${iotaNamesClient.config.paymentsPackageId}::payments::PaymentsAuth>`;
const AUCTION_TYPE = `${authKeyType}<${iotaNamesClient.config.auctionPackageId}::auction::AuctionAuth>`;

async function getAuthorizedSmartContractTypes() {
    const { data: dynamicFields } = await iotaClient.getDynamicFields({
        parentId: iotaNamesClient.config.iotaNamesObjectId,
    });

    const fieldTypes = dynamicFields.map((field) => field.name.type);

    const isPaymentAuthorized = fieldTypes.includes(PAYMENT_TYPE);
    const isAuctionAuthorized = fieldTypes.includes(AUCTION_TYPE);

    return {
        isPaymentAuthorized,
        isAuctionAuthorized,
    };
}

function runCommand(cmd: string, envs: Record<string, string> = {}) {
    return new Promise<string>((resolve, reject) => {
        exec(cmd, { env: { ...process.env, ...envs } }, (error, stdout, stderr) => {
            if (error) {
                const message = [
                    `❌ Command failed: ${cmd}`,
                    stderr.trim() && `stderr:\n${stderr.trim()}`,
                    stdout.trim() && `stdout:\n${stdout.trim()}`,
                ]
                    .filter(Boolean)
                    .join('\n\n');
                return reject(new Error(message));
            }

            resolve(stdout.trim());
        });
    });
}

export {
    DEFAULT_NETWORK,
    NETWORK_CONFIG,
    iotaClient,
    iotaNamesClient,
    PAYMENT_TYPE,
    AUCTION_TYPE,
    getAuthorizedSmartContractTypes,
    runCommand,
};
