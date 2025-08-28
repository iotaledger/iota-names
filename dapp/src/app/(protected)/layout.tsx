// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { LoadingIndicator } from '@iota/apps-ui-kit';
import { redirect } from 'next/navigation';
import { useEffect, type PropsWithChildren } from 'react';

import { useConnectionGuard } from '@/hooks';
import { TermsAndConds } from '@/lib/utils/termsAndConditions';

export default function ProtectedLayout({ children }: PropsWithChildren) {
    const { autoConnect, needRedirect } = useConnectionGuard();

    useEffect(() => {
        const areAccepted = TermsAndConds.areAccepted();
        if (!areAccepted) {
            redirect('/?modal=terms_conditions');
        }
    }, []);

    if (autoConnect === 'idle' || needRedirect) {
        return (
            <div className="flex h-screen w-full justify-center items-center">
                <LoadingIndicator size="w-16 h-16" />
            </div>
        );
    }

    // Only render if connected
    return (
        <main className="flex flex-col min-h-screen">
            <div className="container w-full h-full pt-20 flex flex-col flex-1">
                <div className="flex flex-col w-full gap-y-lg py-lg flex-1">{children}</div>
            </div>
        </main>
    );
}
