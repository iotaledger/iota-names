// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ConnectButton as DappConnectButton } from '@iota/dapp-kit';
import { useRouter } from 'next/navigation';

import { TermsAndConds } from '@/lib/utils/termsAndConditions';

export function ConnectButton() {
    const router = useRouter();

    function handleClick(ev: React.MouseEvent) {
        const areTermsAndConditionsAccepted = TermsAndConds.areAccepted();
        if (!areTermsAndConditionsAccepted) {
            // Prevent the dapp kit modal from opening
            ev.preventDefault();
            ev.stopPropagation();
            router.replace(`${window.location.pathname}/?modal=terms_conditions`, {
                scroll: false,
            });
        }
    }

    return <DappConnectButton onClick={handleClick} connectText="Connect" />;
}
