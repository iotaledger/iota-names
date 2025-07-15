// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Search } from '@iota/apps-ui-icons';
import { Dialog, DialogContent, Input, InputType } from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { MY_NAMES_ROUTE, PROTECTED_ROUTES } from '@/lib/constants';
import { NamesLogoWeb } from '@/public/icons';

import { AvailabilityCheck } from '../AvailabilityCheck';

export function Navbar() {
    const { isConnected } = useCurrentWallet();
    const pathname = usePathname();
    const [isSearchDialogOpen, setSearchDialogOpen] = useState(false);

    const isOnMyNamesPage = pathname === MY_NAMES_ROUTE.path;
    const showSearch = isConnected && isOnMyNamesPage;

    function toggleSearchDialog() {
        setSearchDialogOpen(!isSearchDialogOpen);
    }

    return (
        <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg">
            <div className="container py-md flex flex-col gap-y-sm">
                <div className="flex flex-row justify-between items-center gap-x-md">
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

                    {showSearch && <SearchInput isBelowMd onFocus={toggleSearchDialog} />}
                    <ConnectButton connectText="Connect" />
                </div>

                {showSearch && <SearchInput onFocus={toggleSearchDialog} />}

                {isSearchDialogOpen && (
                    <Dialog open onOpenChange={toggleSearchDialog}>
                        <DialogContent
                            showCloseOnOverlay
                            customWidth="w-[60vw] h-[clamp(400px,80vh,600px)]"
                            isFixedPosition
                        >
                            <div className="flex flex-col gap-md px-48 py-20 flex-1">
                                <AvailabilityCheck
                                    autoFocusInput
                                    onCompleted={() => setSearchDialogOpen(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </nav>
    );
}

function SearchInput({ isBelowMd = false, onFocus }: { isBelowMd?: boolean; onFocus: () => void }) {
    const wrapperClass = isBelowMd
        ? 'md:flex hidden w-full max-w-[360px] justify-center mx-auto'
        : 'flex md:hidden w-full justify-center mx-auto';

    const containerClass =
        'w-full max-w-2xl flex flex-col backdrop-blur-md bg-white/5 overflow-hidden [&_*]:!border-none rounded-full';

    return (
        <div className={wrapperClass}>
            <div className={containerClass}>
                <Input
                    placeholder="Search for your IOTA name"
                    type={InputType.Text}
                    onFocus={onFocus}
                    trailingElement={<Search className="text-names-neutral-92 w-6 h-6" />}
                />
            </div>
        </div>
    );
}
