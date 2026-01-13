// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Close, Warning } from '@iota/apps-ui-icons';
import { Button, ButtonSize, ButtonType } from '@iota/apps-ui-kit';
import { useIotaClientContext } from '@iota/dapp-kit';
import { useState } from 'react';

export function TestModeBanner({ onDismiss }: { onDismiss?: () => void }) {
    const { network } = useIotaClientContext();
    const [isDismissed, setIsDismissed] = useState(false);

    const shouldShowBanner =
        network !== 'mainnet' && network !== 'localnet' && network !== 'custom';

    if (isDismissed || !shouldShowBanner) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    const handleSwitchToMainnet = () => {
        window.location.href = 'https://iotanames.com/';
    };

    return (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-200 z-[60]">
            <div className="flex items-center justify-between w-full px-md py-xxs">
                <div className="flex items-center gap-xs">
                    <Warning className="w-3 h-3 text-yellow-700" />
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-yellow-800">Test Mode Active</p>
                        <p className="text-xs text-yellow-700">
                            You're connected to {network}. No real funds will be used.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-xxs">
                    <Button
                        onClick={handleSwitchToMainnet}
                        text="Switch to Mainnet"
                        size={ButtonSize.Small}
                        type={ButtonType.Secondary}
                    />
                    <Button
                        onClick={handleDismiss}
                        icon={<Close className="text-yellow-900" />}
                        size={ButtonSize.Small}
                        type={ButtonType.Ghost}
                    />
                </div>
            </div>
        </div>
    );
}
