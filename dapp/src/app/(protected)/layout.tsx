// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useCurrentAccount } from '@iota/dapp-kit';
import { redirect } from 'next/navigation';
import { useEffect, type PropsWithChildren } from 'react';

import { CONNECT_ROUTE } from '@/lib/constants';

export default function ProtectedLayout({ children }: PropsWithChildren): JSX.Element {
    const currentAccount = useCurrentAccount();

    useEffect(() => {
        if (!currentAccount) {
            redirect(CONNECT_ROUTE.path);
        }
    }, [currentAccount]);

    return (
        <main className="flex flex-col min-h-screen">
            <div className="container w-full h-full pt-20 flex flex-col flex-1">
                <div className="flex flex-col w-full gap-y-lg py-lg flex-1">{children}</div>
            </div>
        </main>
    );
}
