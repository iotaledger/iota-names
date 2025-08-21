// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { LoadingIndicator } from '@iota/apps-ui-kit';
import { useAutoConnectWallet } from '@iota/dapp-kit';
import { redirect, usePathname, useSearchParams } from 'next/navigation';
import { PropsWithChildren } from 'react';

import { PROTECTED_ROUTES } from '@/lib/constants';
import { TermsAndConds } from '@/lib/utils/termsAndConditions';

export function ConnectionGuard({ children }: PropsWithChildren) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const autoConnect = useAutoConnectWallet();

    const areTermsAndConditionsAccepted = TermsAndConds.areAccepted();
    const inProtectedRoute = PROTECTED_ROUTES.some((route) => route.path === pathname);

    // Dont allow the user to go to protected routes if the terms and conditions have not been accepted
    if (
        !areTermsAndConditionsAccepted &&
        searchParams.get('modal') !== 'terms_conditions' &&
        inProtectedRoute
    ) {
        return redirect('/?modal=terms_conditions');
    }

    if (autoConnect === 'idle') {
        return (
            <div className="flex h-screen w-full justify-center">
                <LoadingIndicator size="w-16 h-16" />
            </div>
        );
    }

    return autoConnect === 'attempted' ? children : null;
}
