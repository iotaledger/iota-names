// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
'use client';

import { LoadingIndicator } from '@iota/apps-ui-kit';
import { useAutoConnectWallet, useCurrentWallet, useWalletStoreSync } from '@iota/dapp-kit';
import { redirect, usePathname } from 'next/navigation';
import { PropsWithChildren, useEffect, useMemo } from 'react';

import { PROTECTED_ROUTES } from '@/lib/constants';

export function ConnectionGuard({ children }: PropsWithChildren) {
    const autoConnect = useAutoConnectWallet();
    const { connectionStatus } = useCurrentWallet();
    const pathname = usePathname();
    const lastConnectedWalletName = useWalletStoreSync('lastConnectedWalletName');
    const hasPersistedWallet = Boolean(lastConnectedWalletName);

    const isProtectedRoute = useMemo(
        () => PROTECTED_ROUTES.some((route) => pathname.startsWith(route.path)),
        [pathname],
    );

    useEffect(() => {
        if (autoConnect !== 'attempted') return;

        if (connectionStatus === 'disconnected' && isProtectedRoute) {
            // Auto-connect is still in progress, defer redirect
            if (hasPersistedWallet) {
                return;
            }

            // No persisted wallet, safe to redirect
            redirect('/');
        }
    }, [autoConnect, connectionStatus, isProtectedRoute, hasPersistedWallet]);

    if (autoConnect === 'idle') {
        return (
            <div className="flex h-screen w-full justify-center">
                <LoadingIndicator size="w-16 h-16" />
            </div>
        );
    }

    return autoConnect === 'attempted' ? children : null;
}
