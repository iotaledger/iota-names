// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { execFileSync, execSync } from 'child_process';
import fs, { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import TOML, { JsonMap } from '@iarna/toml';
import { getFullnodeUrl, IotaClient } from '@iota/iota-sdk/client';
import { decodeIotaPrivateKey } from '@iota/iota-sdk/cryptography';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Secp256k1Keypair } from '@iota/iota-sdk/keypairs/secp256k1';
import { Secp256r1Keypair } from '@iota/iota-sdk/keypairs/secp256r1';
import { Transaction, UpgradePolicy } from '@iota/iota-sdk/transactions';
import { toBase64 } from '@iota/iota-sdk/utils';

import { PackageInfo } from '../package-info/constants';

const IOTA = process.env.IOTA_BINARY ?? `iota`;

export const getActiveAddress = () => {
    return execSync(`${IOTA} client active-address`, { encoding: 'utf8' }).trim();
};

export const getActiveEnv = (configPath?: string) => {
    const command = [
        'client',
        ...(configPath ? ['--client.config', configPath] : []),
        'active-env',
    ];
    return execFileSync(IOTA, command, {
        encoding: 'utf-8',
    }).trim();
};

export const getChainId = (configPath?: string) => {
    const command = [
        'client',
        ...(configPath ? ['--client.config', configPath] : []),
        'chain-identifier',
    ];
    return execFileSync(IOTA, command, {
        encoding: 'utf-8',
    }).trim();
};

export const publishPackage = (txb: Transaction, path: string, configPath?: string) => {
    const command = [
        'move',
        ...(configPath ? ['--client.config', configPath] : []),
        'build',
        '--dump-bytecode-as-base64',
        '--path',
        path,
    ];

    const { modules, dependencies } = JSON.parse(
        execFileSync(IOTA, command, {
            encoding: 'utf-8',
        }),
    );

    const cap = txb.publish({
        modules,
        dependencies,
    });

    const sender = txb.moveCall({
        target: `0x2::tx_context::sender`,
    });

    // Transfer the upgrade capability to the sender so they can upgrade the package later if they want.
    txb.transferObjects([cap], sender);
};

export const managePackage = (packageId: string, packageFolder: string, configPath?: string) => {
    const activeEnv = getActiveEnv(configPath);

    var versionNumber = '1';
    var originalId = packageId;
    var latestId = packageId;
    const metadata = getManagedMetadata(packageFolder, activeEnv);
    var chainId: string;
    if (metadata) {
        chainId = metadata['chain-id'] as string;
        versionNumber = String((metadata['published-version'] as number) + 1);
        originalId = metadata['original-published-id'] as string;
    } else {
        chainId = getChainId(configPath);
    }

    const command = [
        'move',
        ...(configPath ? ['--client.config', configPath] : []),
        'manage-package',
        '--environment',
        activeEnv,
        '--network-id',
        chainId,
        '--original-id',
        originalId,
        '--latest-id',
        latestId,
        '--version-number',
        versionNumber,
        '--path',
        packageFolder,
    ];

    execFileSync(IOTA, command, {
        encoding: 'utf-8',
    });
};

export const upgradePackage = (
    txb: Transaction,
    path: string,
    packageId: string,
    upgradeCapId: string,
    configPath?: string,
) => {
    const { modules, dependencies, digest } = JSON.parse(
        execFileSync(IOTA, ['move', 'build', '--dump-bytecode-as-base64', '--path', path], {
            encoding: 'utf-8',
        }),
    );
    console.log(digest);
    console.log(packageId);
    console.log(upgradeCapId);

    const cap = txb.object(upgradeCapId);

    const ticket = txb.moveCall({
        target: '0x2::package::authorize_upgrade',
        arguments: [cap, txb.pure.u8(UpgradePolicy.COMPATIBLE), txb.pure.vector('u8', digest)],
    });

    const receipt = txb.upgrade({
        modules,
        dependencies,
        package: packageId,
        ticket,
    });

    txb.moveCall({
        target: '0x2::package::commit_upgrade',
        arguments: [cap, receipt],
    });

    managePackage(packageId, path, configPath);

    console.info(`Updated lock file for package: ${packageId}`);
};

/// Returns a signer based on the active address of system's iota.
export const getSigner = () => {
    if (process.env.PRIVATE_KEY) {
        console.log('Using supplied private key.');
        const { schema, secretKey } = decodeIotaPrivateKey(process.env.PRIVATE_KEY);

        if (schema === 'ED25519') return Ed25519Keypair.fromSecretKey(secretKey);
        if (schema === 'Secp256k1') return Secp256k1Keypair.fromSecretKey(secretKey);
        if (schema === 'Secp256r1') return Secp256r1Keypair.fromSecretKey(secretKey);

        throw new Error('Keypair not supported.');
    }

    const sender = getActiveAddress();

    const keystore = JSON.parse(
        readFileSync(path.join(homedir(), '.iota', 'iota_config', 'iota.keystore'), 'utf8'),
    );

    // Support for old format, can be removed once https://github.com/iotaledger/iota/pull/7704 is in production
    if (Array.isArray(keystore)) {
        for (const priv of keystore) {
            const keypair = decodeIotaPrivateKey(priv);

            const pair = Ed25519Keypair.fromSecretKey(keypair.secretKey);
            if (pair.getPublicKey().toIotaAddress() === sender) {
                return pair;
            }
        }
        throw new Error(`keypair not found for sender: ${sender}`);
    }

    // New format
    for (const entry of keystore.keys) {
        if (entry.key.type !== 'key_pair' || entry.address !== sender) {
            continue;
        }
        const keypair = decodeIotaPrivateKey(entry.key.value);
        return Ed25519Keypair.fromSecretKey(keypair.secretKey);
    }

    throw new Error(`keypair not found for sender: ${sender}`);
};

/// Get the client for the specified network.
export const getClient = (network: string) => {
    const url = process.env.RPC_URL || getFullnodeUrl(network);
    return new IotaClient({ url });
};

/// A helper to sign & execute a transaction.
export const signAndExecute = async (txb: Transaction, network: string) => {
    const client = getClient(network);
    const signer = getSigner();

    return client.signAndExecuteTransaction({
        transaction: txb,
        signer,
        options: {
            showEffects: true,
            showObjectChanges: true,
        },
    });
};

/// Builds a transaction (unsigned) and saves it on `setup/tx/tx-data.txt` (on production)
/// or `setup/src/tx-data.local.txt` on mainnet.
export const prepareMultisigTx = async (tx: Transaction, network: string, address?: string) => {
    const adminAddress = address ?? getActiveAddress();
    const client = getClient(network);

    let gasPrice = await client.getReferenceGasPrice();
    // Prevent any possible RGP changes across epoch change, which would invalidate the transaction.
    tx.setGasPrice(gasPrice);

    // set the sender to be the admin address from config.
    tx.setSenderIfNotSet(adminAddress as string);

    // first do a dryRun, to make sure we are getting a success.
    const dryRun = await inspectTransaction(tx, client);

    if (!dryRun) throw new Error('This transaction failed.');

    tx.build({
        client,
    }).then((bytes) => {
        let serializedBase64 = toBase64(bytes);

        const output_location =
            process.env.NODE_ENV === 'development' ? './tx/tx-data-local.txt' : './tx/tx-data.txt';

        const dir = path.dirname(output_location);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(output_location, serializedBase64);
    });
};

/// A helper to dev inspect a transaction.
async function inspectTransaction(tx: Transaction, client: IotaClient) {
    const result = await client.dryRunTransactionBlock({
        transactionBlock: await tx.build({ client: client }),
    });
    // log the result.
    console.dir(result, { depth: null });

    return result.effects.status.status === 'success';
}

export const getAllObjectsByType = async (type: string, owner: string, client: IotaClient) => {
    let objects = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
        const data = await client.getOwnedObjects({
            owner,
            filter: {
                StructType: type,
            },
            options: {
                showContent: true,
                showType: true,
            },
            cursor,
        });

        hasNextPage = data.hasNextPage;
        cursor = data.nextCursor;
        objects.push(...data.data.map((x) => x.data!));
    }

    return objects;
};

export const getManagedMetadata = (packageFolder: string, activeEnv: string) => {
    const lockFilePath = path.resolve(packageFolder + '/Move.lock');
    if (existsSync(lockFilePath)) {
        const lockFile = TOML.parse(readFileSync(lockFilePath, 'utf8'));
        const env = lockFile['env'] as JsonMap;
        if (env) {
            return env[activeEnv] as JsonMap;
        }
    }
};

export const getCoinMetadataId = async (network: string, type: string) => {
    const iotaClient = new IotaClient({
        url: getFullnodeUrl(network),
    });
    const metadata = await iotaClient.getCoinMetadata({ coinType: type });
    if (!metadata || !metadata.id) {
        throw new Error('Coin metadata or ID not found.');
    }
    return metadata.id;
};

export const getObjectType = async (network: string, objectId: string): Promise<string> => {
    const iotaClient = new IotaClient({
        url: getFullnodeUrl(network),
    });
    const objectResponse = await iotaClient.getObject({
        id: objectId,
        options: { showType: true },
    });
    if (objectResponse && objectResponse.data && objectResponse.data.type) {
        return objectResponse.data.type;
    }
    throw new Error('Object data not found');
};

const extractStringValues = (obj: unknown): string[] => {
    if (typeof obj === 'string') return [obj];
    if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).flatMap(extractStringValues);
    }
    return [];
};

export const getIotaNamesAdminObjects = async (
    packageInfo: PackageInfo,
    client: IotaClient,
): Promise<string[]> => {
    // PackageIDs, UpgradeCap IDs, Publisher and Display objects
    // Recursively extract all string values (including nested version maps like packageId, auctionPackageId, etc.)
    const packageValues = extractStringValues(packageInfo);

    const ownedObjectsPage = await client.getOwnedObjects({
        owner: packageInfo.adminAddress,
        options: { showContent: true },
    });

    let objectIds = [];
    for (const object of ownedObjectsPage.data) {
        for (const packageValue of packageValues) {
            if (JSON.stringify(object).includes(packageValue)) {
                objectIds.push(object.data?.objectId!);
                break;
            }
        }
    }
    return objectIds;
};
