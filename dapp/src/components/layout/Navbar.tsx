// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PROTECTED_ROUTES } from '@/lib/constants';
import { NamesLogoWeb } from '@/public/icons';

import SearchBox from '../Searchbox';

export function Navbar() {
    const { isConnected } = useCurrentWallet();
    const pathname = usePathname();
    const isOnMyNamesPage = pathname === '/my-names';

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-names-neutral-20">
            <div className="container flex justify-between py-2">
                <div className="flex flex-row gap-x-lg items-center">
                    <NamesLogoWeb className="w-32 h-2xl text-names-primary-100" />
                    <div className="text-names-neutral-70 text-body-md">
                        {isConnected &&
                            PROTECTED_ROUTES.map((route) => (
                                <Link
                                    key={route.path}
                                    href={route.path}
                                    className="text-label-md hover:text-names-primary-80"
                                    data-testid={`${route.id}-link`}
                                >
                                    {route.title}
                                </Link>
                            ))}
                    </div>
                </div>
                {isConnected && isOnMyNamesPage && <SearchBox />}
                <div className="flex flex-row gap-x-sm items-center">
                    <div className="flex items-center space-x-2">
                        <ConnectButton connectText="Connect" />
                    </div>
                </div>
            </div>
        </nav>
    );
}
