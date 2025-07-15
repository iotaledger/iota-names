// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { darkTheme, IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import { getAllNetworks } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { Toaster } from '@/components/Toaster';
import { IotaNamesClientProvider, IotaNamesIndexerClientProvider } from '@/contexts';
import { KioskClientProvider } from '@/contexts/KioskClientContext';
import { APP_STATIC_THEME } from '@/lib/constants/theme.constants';
import { createIotaClient } from '@/lib/utils/defaultRpcClient';

import { ThemeProvider } from './ThemeProvider';

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
                        <IotaNamesIndexerClientProvider>
                            <WalletProvider
                                autoConnect={true}
                                theme={[
                                    {
                                        selector: '.names',
                                        variables: darkTheme,
                                    },
                                ]}
                            >
                                <ThemeProvider staticTheme={APP_STATIC_THEME}>
                                    {children}
                                    <Toaster />
                                </ThemeProvider>
                            </WalletProvider>
                        </IotaNamesIndexerClientProvider>
                    </IotaNamesClientProvider>
                </KioskClientProvider>
            </IotaClientProvider>
        </QueryClientProvider>
    );
}
