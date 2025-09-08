// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Close, MenuIcon } from '@iota/apps-ui-icons';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { NamesLogoWeb } from '@/components/svgs';
import type { ExternalRoute, Route } from '@/lib/interfaces';

type Props = {
    logo: React.ReactNode;
    routes: Route[];
    onClose: () => void;
};

const isExternalRoute = (r: Route): r is ExternalRoute =>
    'isExternal' in r && r.isExternal === true;

export function MobileOverlayMenu({
    logo,
    routes,
    children,
    onClose,
}: React.PropsWithChildren<Props>) {
    return createPortal(
        <div className="fixed inset-0 z-[60]" onMouseDown={onClose} role="dialog" aria-modal="true">
            <div className="absolute top-0 left-0 right-0" onMouseDown={(e) => e.stopPropagation()}>
                <div className="px-lg py-md flex flex-row items-center justify-between bg-names-neutral-6 text-white">
                    {logo}
                    <button
                        type="button"
                        className="w-6 h-6 [&_svg]:w-full [&_svg]:h-full"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <Close />
                    </button>
                </div>

                <div className="px-lg pb-xl bg-names-neutral-6">
                    <nav className="flex flex-col gap-y-4">
                        {routes.map((route) => (
                            <Link
                                key={route.id ?? route.path}
                                href={route.path}
                                className="text-label-lg hover:text-names-primary-80"
                                {...(isExternalRoute(route)
                                    ? { target: '_blank', rel: 'noopener noreferrer' }
                                    : {})}
                                onClick={onClose}
                            >
                                {route.title}
                            </Link>
                        ))}
                        {children}
                    </nav>
                </div>
            </div>
        </div>,
        document.body,
    );
}

type Propss = {
    routes: Route[];
    children?: React.ReactNode;
};

export function MobileNavbar({ routes, children }: Propss) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('overflow-hidden', open);
        return () => document.body.classList.remove('overflow-hidden');
    }, [open]);

    return (
        <>
            <button
                type="button"
                className="w-6 h-6 [&_svg]:w-full [&_svg]:h-full"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
            >
                <MenuIcon />
            </button>

            {open && (
                <MobileOverlayMenu
                    routes={routes}
                    onClose={() => setOpen(false)}
                    logo={
                        <Link href="/" aria-label="Go to homepage">
                            <NamesLogoWeb className="w-32 h-2xl text-names-primary-100" />
                        </Link>
                    }
                >
                    {children}
                </MobileOverlayMenu>
            )}
        </>
    );
}
