// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useCurrentAccount } from '@iota/dapp-kit';
import { redirect } from 'next/navigation';
import { useEffect, type PropsWithChildren } from 'react';

// import { CONNECT_ROUTE } from '@/lib/constants/routes.constants';

export interface ProtectedRoute {
    title: string;
    path: string;
    icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
    id: string;
}

export interface PublicRoute extends Pick<ProtectedRoute, 'path'> {}

export const CONNECT_ROUTE: PublicRoute = {
    path: '/',
};

function ProtectedLayout({ children }: PropsWithChildren): JSX.Element {
    const currentAccount = useCurrentAccount();

    useEffect(() => {
        if (!currentAccount) {
            redirect(CONNECT_ROUTE.path);
        }
    }, [currentAccount]);

    return (
        <main className="flex flex-col h-screen">
            <div className="container w-full h-full py-12 flex">{children}</div>
        </main>
    );
}

export default ProtectedLayout;
