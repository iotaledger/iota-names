// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react';
import { darkTheme, IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import { getAllNetworks, getAppsBackend } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Toaster } from '@/components/Toaster';
import { CONFIG } from '@/config';
import { IotaNamesClientProvider, IotaNamesIndexerClientProvider } from '@/contexts';
import { KioskClientProvider } from '@/contexts/KioskClientContext';
import { APP_STATIC_THEME } from '@/lib/constants/theme.constants';
import { Feature } from '@/lib/enums';
// import { initAnalytics } from '@/lib/utils/analytics/amplitude';
import { createIotaClient } from '@/lib/utils/defaultRpcClient';

import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }: React.PropsWithChildren) {
    const [queryClient] = useState(() => new QueryClient());
    const [growthbook] = useState(
        () =>
            new GrowthBook({
                apiHost: getAppsBackend(),
                clientKey: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY || '',
                enableDevMode: process.env.NODE_ENV === 'development',
                features: {
                    [Feature.FiatConversion]: {
                        defaultValue: {
                            mainnet: false,
                            testnet: true,
                            devnet: true,
                        },
                    },
                },
            }),
    );

    const allNetworks = getAllNetworks();
    const defaultNetwork = CONFIG.network;

    useEffect(() => {
        // Uncomment init amplitude when we get response from the legal
        // initAnalytics(defaultNetwork);
    }, [defaultNetwork]);

    function handleNetworkChange() {
        queryClient.resetQueries();
        queryClient.clear();
    }

    return (
        <QueryClientProvider client={queryClient}>
            <GrowthBookProvider growthbook={growthbook}>
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
            </GrowthBookProvider>
        </QueryClientProvider>
    );
}
