// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useCurrentAccount } from '@iota/dapp-kit';
import { redirect } from 'next/navigation';
import { useEffect, type PropsWithChildren } from 'react';

import { CONNECT_ROUTE } from '@/lib/constants';
import { TermsAndConds } from '@/lib/utils/termsAndConditions';

export default function ProtectedLayout({ children }: PropsWithChildren) {
    const currentAccount = useCurrentAccount();

    useEffect(() => {
        if (!currentAccount) {
            return redirect(CONNECT_ROUTE.path);
        }

        const areAccepted = TermsAndConds.areAccepted();
        if (!areAccepted) {
            redirect('/?modal=terms_conditions');
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
