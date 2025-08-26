// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { LoadingIndicator } from '@iota/apps-ui-kit';
import { useAutoConnectWallet, useCurrentWallet } from '@iota/dapp-kit';
import { redirect } from 'next/navigation';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { CONNECT_ROUTE } from '@/lib/constants';
import { TermsAndConds } from '@/lib/utils/termsAndConditions';

export default function ProtectedLayout({ children }: PropsWithChildren) {
    const { isConnecting, isConnected, isDisconnected } = useCurrentWallet();
    const autoConnect = useAutoConnectWallet();
    const [status, setStatus] = useState<'idle' | 'connecting' | 'disconnected'>('idle');

    if (status === 'idle') {
        if (autoConnect === 'attempted-connection' && isConnecting) {
            // Auto connect found a wallet and it started connecting
            setStatus('connecting');
        } else if (autoConnect === 'attempted') {
            // Auto could not make a successful connection
            setStatus('disconnected');
        }
    }

    useEffect(() => {
        if (status !== 'idle' && isDisconnected) {
            return redirect(CONNECT_ROUTE.path);
        }

        const areAccepted = TermsAndConds.areAccepted();
        if (!areAccepted) {
            redirect('/?modal=terms_conditions');
        }
    }, [status, isDisconnected]);

    if (autoConnect === 'idle') {
        return (
            <div className="flex h-screen w-full justify-center">
                <LoadingIndicator size="w-16 h-16" />
            </div>
        );
    }

    console.log(autoConnect);

    return isConnected ? (
        <main className="flex flex-col min-h-screen">
            <div className="container w-full h-full pt-20 flex flex-col flex-1">
                <div className="flex flex-col w-full gap-y-lg py-lg flex-1">{children}</div>
            </div>
        </main>
    ) : null;
}
