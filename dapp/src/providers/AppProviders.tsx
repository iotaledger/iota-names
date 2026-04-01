// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { AppsBackendClientProvider } from '@iota/apps-backend-client';
import { darkTheme, IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import { getAllNetworks } from '@iota/iota-sdk/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useEffect, useState } from 'react';

import { CookieDisclaimer } from '@/components/disclaimer/CookieDisclaimer';
import { Toaster } from '@/components/Toaster';
import { CONFIG } from '@/config';
import { IotaNamesClientProvider, IotaNamesIndexerClientProvider } from '@/contexts';
import { KioskClientProvider } from '@/contexts/KioskClientContext';
import { captureException } from '@/instrumentation';
import { APP_STATIC_THEME } from '@/lib/constants/theme.constants';
import { ampli } from '@/lib/utils/analytics/ampli';
import { getAmplitudeConsentStatus, initAmplitude } from '@/lib/utils/analytics/amplitude';
import { appsBackendClient } from '@/lib/utils/appsBackendClient';
import { createIotaClient } from '@/lib/utils/defaultRpcClient';

import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }: React.PropsWithChildren) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                queryCache: new QueryCache({
                    onError: (error) => {
                        captureException(error);
                    },
                }),
                mutationCache: new MutationCache({
                    onError: (error) => {
                        captureException(error);
                    },
                }),
            }),
    );
    const allNetworks = getAllNetworks();
    const defaultNetwork = CONFIG.network;

    useEffect(() => {
        (async () => {
            const amplitudeConsentStatus = getAmplitudeConsentStatus();
            if (amplitudeConsentStatus !== 'declined') {
                await initAmplitude();
                await ampli.openedIotaNames({
                    activeOrigin: window.location.origin,
                    pagePath: window.location.pathname,
                    pagePathFragment: `${location.pathname}${location.search}${location.hash}`,
                }).promise;
            }
        })();
    }, []);

    function handleNetworkChange() {
        queryClient.resetQueries();
        queryClient.clear();
    }

    return (
        <QueryClientProvider client={queryClient}>
            <AppsBackendClientProvider client={appsBackendClient}>
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
                                    chain={allNetworks[defaultNetwork].chain}
                                >
                                    <ThemeProvider staticTheme={APP_STATIC_THEME}>
                                        {children}
                                        <Toaster />
                                        <Suspense fallback={null}>
                                            <CookieDisclaimer />
                                        </Suspense>
                                    </ThemeProvider>
                                </WalletProvider>
                            </IotaNamesIndexerClientProvider>
                        </IotaNamesClientProvider>
                    </KioskClientProvider>
                </IotaClientProvider>
            </AppsBackendClientProvider>
        </QueryClientProvider>
    );
}
