// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';

import { ThemeSwitcher } from './ThemeSwitcher';

export function Navbar() {
    const { isConnected } = useCurrentWallet();
    return (
        <nav className="sticky top-0 ">
            <div className="container flex justify-between p-2">
                <h1 className="flex items-center text-headline-sm">IOTA NAMES</h1>
                {isConnected && (
                    <div className="flex items-center space-x-2">
                        <span className="text-body-sm">Connected</span>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <ThemeSwitcher />
                    <ConnectButton connectText="Connect" />
                </div>
            </div>
        </nav>
    );
}
