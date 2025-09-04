// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ConnectButton as DappConnectButton } from '@iota/dapp-kit';
import { useRouter } from 'next/navigation';

import { TermsAndConds } from '@/lib/utils/termsAndConditions';
import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

export function ConnectButton() {
    const { close } = useAvailabilityCheckDialog();
    const router = useRouter();

    function handleClick(ev: React.MouseEvent) {
        const areTermsAndConditionsAccepted = TermsAndConds.areAccepted();
        if (!areTermsAndConditionsAccepted) {
            close();
            // Prevent the dapp kit modal from opening
            ev.preventDefault();
            ev.stopPropagation();
            router.replace(`${window.location.pathname}/?modal=terms_conditions&redirect=connect`, {
                scroll: false,
            });
        }
    }

    return <DappConnectButton onClick={handleClick} connectText="Connect" />;
}
