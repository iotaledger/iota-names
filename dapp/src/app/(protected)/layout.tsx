// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { LoadingIndicator } from '@iota/apps-ui-kit';
import { useAutoConnectWallet, useCurrentAccount, useCurrentWallet } from '@iota/dapp-kit';
import { redirect, usePathname } from 'next/navigation';
import { useEffect, type PropsWithChildren } from 'react';

import { CONNECT_ROUTE } from '@/lib/constants';
import { TermsAndConds } from '@/lib/utils/termsAndConditions';

export default function ProtectedLayout({ children }: PropsWithChildren) {
    const pathname = usePathname();
    const autoConnect = useAutoConnectWallet();
    const currentAccount = useCurrentAccount();
    const { isDisconnected } = useCurrentWallet();

    useEffect(() => {
        if (!currentAccount && isDisconnected && autoConnect === 'attempted') {
            return redirect(CONNECT_ROUTE.path);
        }

        const areAccepted = TermsAndConds.areAccepted();
        if (!areAccepted) {
            redirect('/?modal=terms_conditions');
        }
    }, [autoConnect, currentAccount, isDisconnected, pathname]);

    if (autoConnect === 'idle') {
        return (
            <div className="flex h-screen w-full justify-center items-center">
                <LoadingIndicator size="w-16 h-16" />
            </div>
        );
    }

    return autoConnect === 'attempted' ? (
        <main className="flex flex-col min-h-screen">
            <div className="container w-full h-full pt-20 flex flex-col flex-1">
                <div className="flex flex-col w-full gap-y-lg py-lg flex-1">{children}</div>
            </div>
        </main>
    ) : null;
}
