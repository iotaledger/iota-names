// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useIotaClientContext } from '@iota/dapp-kit';
import { IotaNamesClient, Network } from '@iota/iota-names-sdk';
import React, { createContext, useContext, useMemo } from 'react';

export const IotaNamesClientProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { iotaNamesClient } = useIotaNamesClient();

    return (
        <IotaNamesClientContext.Provider value={{ iotaNamesClient }}>
            {children}
        </IotaNamesClientContext.Provider>
    );
};

type IotaNamesClientContextType = {
    iotaNamesClient: IotaNamesClient | null;
};

export const IotaNamesClientContext = createContext<IotaNamesClientContextType | null>(null);

export function useIotaNamesClientContext(): IotaNamesClientContextType {
    const context = useContext(IotaNamesClientContext);

    if (!context) {
        throw new Error('useIotaNamesClientContext must be used within a IotaNamesClientProvider');
    }

    return context;
}

export function useIotaNamesClient() {
    const { network: networkName, client } = useIotaClientContext();

    const iotaNamesClient = useMemo(() => {
        return new IotaNamesClient({
            client,
            network: networkName as Network,
        });
    }, [client, networkName]);

    return { iotaNamesClient };
}
