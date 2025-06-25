// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { darkTheme, IotaClientProvider, lightTheme, WalletProvider } from '@iota/dapp-kit';
import { getAllNetworks } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { IotaNamesClientProvider } from '@/contexts';
import { KioskClientProvider } from '@/contexts/KioskClientContext';
import { createIotaClient } from '@/lib/utils/defaultRpcClient';

import { ThemeProvider } from './';

export function AppProviders({ children }: React.PropsWithChildren) {
    const [queryClient] = useState(() => new QueryClient());
    const allNetworks = getAllNetworks();
    // devnet only atm
    const defaultNetwork = 'devnet';

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
                <KioskClientProvider>
                    <IotaNamesClientProvider>
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
                            <ThemeProvider appId="IOTA-evm-bridge">{children}</ThemeProvider>
                        </WalletProvider>
                    </IotaNamesClientProvider>
                </KioskClientProvider>
            </IotaClientProvider>
        </QueryClientProvider>
    );
}
