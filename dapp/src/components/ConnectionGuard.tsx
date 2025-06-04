// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Info } from '@iota/apps-ui-icons';
import { LoadingIndicator } from '@iota/apps-ui-kit';
import { useAutoConnectWallet, useCurrentWallet } from '@iota/dapp-kit';
import { redirect, usePathname } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';

export interface ProtectedRoute {
    title: string;
    path: string;
    icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
    id: string;
}

export interface PublicRoute extends Pick<ProtectedRoute, 'path'> {}
export enum ProtectedRouteTitle {
    MyNames = 'My Names',
}

export const CONNECT_ROUTE: PublicRoute = {
    path: '/',
};

export const MAIN_PROTECTED_ROUTE: ProtectedRoute = {
    title: ProtectedRouteTitle.MyNames,
    path: '/my-names',
    icon: Info,
    id: 'my-names',
};

export function ConnectionGuard({ children }: PropsWithChildren) {
    const { isConnected, isDisconnected } = useCurrentWallet();

    const pathname = usePathname();
    const autoConnect = useAutoConnectWallet();

    useEffect(() => {
        if (autoConnect !== 'attempted') return;
        if (isConnected && pathname === CONNECT_ROUTE.path) {
            // Redirect to home if on root ("/")
            redirect(MAIN_PROTECTED_ROUTE.path);
        } else if (isDisconnected && pathname !== CONNECT_ROUTE.path) {
            // Redirect back to "/" if disconnected and trying to access another page
            redirect(CONNECT_ROUTE.path);
        }
    }, [isConnected, isDisconnected, pathname, autoConnect]);

    if (autoConnect === 'idle') {
        return (
            <div className="flex h-screen w-full justify-center">
                <LoadingIndicator size="w-16 h-16" />
            </div>
        );
    }

    return autoConnect === 'attempted' ? children : null;
}
