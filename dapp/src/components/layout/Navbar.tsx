// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MY_NAMES_ROUTE, PROTECTED_ROUTES } from '@/lib/constants';
import { NamesLogoWeb } from '@/public/icons';

import SearchBox from '../Searchbox';

export function Navbar() {
    const { isConnected } = useCurrentWallet();
    const pathname = usePathname();
    const isOnMyNamesPage = pathname === MY_NAMES_ROUTE.path;

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-lg">
            <div className="container pt-5 pb-3.5 flex flex-col gap-y-3">
                <div className="flex flex-row justify-between items-center gap-x-4">
                    <div className="flex flex-row gap-x-lg items-center">
                        <Link href="/" aria-label="Go to homepage">
                            <NamesLogoWeb className="w-32 h-2xl text-names-primary-100" />
                        </Link>
                        {isConnected && (
                            <div className="flex gap-x-md text-names-neutral-70 text-body-md">
                                {PROTECTED_ROUTES.map((route) => (
                                    <Link
                                        key={route.path}
                                        href={route.path}
                                        className="text-label-md hover:text-names-primary-80 md:whitespace-nowrap"
                                        data-testid={`${route.id}-link`}
                                    >
                                        {route.title}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    {isConnected && isOnMyNamesPage && (
                        <div className="hidden md:flex w-full justify-center">
                            <SearchBox />
                        </div>
                    )}
                    <ConnectButton connectText="Connect" />
                </div>
                {isConnected && isOnMyNamesPage && (
                    <div className="flex md:hidden w-full justify-center">
                        <SearchBox />
                    </div>
                )}
            </div>
        </nav>
    );
}
