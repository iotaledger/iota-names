// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import Link from 'next/link';

import { PROTECTED_ROUTES } from '@/lib/constants';

export function Navbar() {
    const { isConnected } = useCurrentWallet();
    return (
        <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg border-b border-names-neutral-20">
            <div className="container flex justify-between py-2">
                <h1 className="flex items-center text-headline-sm">IOTA NAMES</h1>
                <div className="flex flex-row gap-x-sm items-center">
                    {isConnected &&
                        PROTECTED_ROUTES.map((route) => (
                            <Link
                                key={route.path}
                                href={route.path}
                                className="text-label-md hover:text-iota-primary-80"
                                data-testid={`${route.id}-link`}
                            >
                                {route.title}
                            </Link>
                        ))}
                    <div className="flex items-center space-x-2">
                        <ConnectButton connectText="Connect" />
                    </div>
                </div>
            </div>
        </nav>
    );
}
