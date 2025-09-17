// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookieManagerProvider } from '@boxfish-studio/react-cookie-manager';
import { darkTheme, IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import { getAllNetworks } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Disclaimer } from '@/components/disclaimer/Disclaimer';
import { Toaster } from '@/components/Toaster';
import { CONFIG } from '@/config';
import { IotaNamesClientProvider, IotaNamesIndexerClientProvider } from '@/contexts';
import { KioskClientProvider } from '@/contexts/KioskClientContext';
import { APP_STATIC_THEME } from '@/lib/constants/theme.constants';
import { initAnalyticsWithCMP } from '@/lib/utils/analytics/amplitude';
import { createIotaClient } from '@/lib/utils/defaultRpcClient';

import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }: React.PropsWithChildren) {
    const [queryClient] = useState(() => new QueryClient());
    const allNetworks = getAllNetworks();
    const defaultNetwork = CONFIG.network;

    useEffect(() => {
        initAnalyticsWithCMP();
    }, []);

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
                                    <CookieManagerProvider>
                                        {children}
                                        <Toaster />
                                        <Disclaimer />
                                    </CookieManagerProvider>
                                </ThemeProvider>
                            </WalletProvider>
                        </IotaNamesIndexerClientProvider>
                    </IotaNamesClientProvider>
                </KioskClientProvider>
            </IotaClientProvider>
        </QueryClientProvider>
    );
}
