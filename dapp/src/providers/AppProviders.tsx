// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { darkTheme, IotaClientProvider, lightTheme, WalletProvider } from '@iota/dapp-kit';
import { getAllNetworks, getDefaultNetwork } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { createIotaClient } from '@/lib/utils/defaultRpcClient';

export function AppProviders({ children }: React.PropsWithChildren) {
    const [queryClient] = useState(() => new QueryClient());
    const allNetworks = getAllNetworks();
    const defaultNetwork = getDefaultNetwork();

    function handleNetworkChange() {
        queryClient.resetQueries();
        queryClient.clear();
    }

    return (
        <QueryClientProvider client={queryClient}>
            <IotaClientProvider
                networks={allNetworks}
                createClient={createIotaClient}
                defaultNetwork={defaultNetwork}
                onNetworkChange={handleNetworkChange}
            >
                <WalletProvider
                    autoConnect={true}
                    theme={[
                        {
                            variables: lightTheme,
                        },
                        {
                            selector: '.dark',
                            variables: darkTheme,
                        },
                    ]}
                >
                    {children}
                </WalletProvider>
            </IotaClientProvider>
        </QueryClientProvider>
    );
}
