// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Discord } from '@iota/apps-ui-icons';
import Link from 'next/link';

import { NamesLogoBranded, X } from '@/public/icons';

interface ExternalLink {
    title?: string;
    path: string;
    icon?: JSX.Element;
    isExternal?: boolean;
}

const EXTERNAL_LINKS: ExternalLink[] = [
    {
        path: 'https://discord.iota.org/',
        icon: <Discord />,
    },
    {
        path: 'https://twitter.com/iota',
        icon: <X />,
    },
];

const USE_CONDITIONS_LINKS: ExternalLink[] = [
    {
        title: 'Terms & Conditions',
        path: 'https://www.iota.org/terms-of-use',
    },
    {
        title: 'Privacy Policy',
        path: 'https://www.iota.org/privacy-policy',
    },
];

export function Footer() {
    const COPYRIGHT_YEAR = new Date().getFullYear();
    return (
        <footer className="w-full bg-names-neutral-6 py-lg">
            <div className="container flex flex-col sm:flex-row justify-between items-center gap-y-lg">
                <div className="flex items-center gap-sm">
                    <NamesLogoBranded />
                    <span className="text-iota-neutral-70 text-label-sm tracking-normal">
                        © {COPYRIGHT_YEAR} IOTA Names. All Rights Reserved.
                    </span>
                </div>
                <div className="flex flex-row gap-md items-center text-iota-neutral-70 text-body-md">
                    {USE_CONDITIONS_LINKS.map(({ path, title }) => (
                        <Link
                            key={title}
                            href={path}
                            className="hover:text-names-primary-80 transition-colors duration-200"
                        >
                            {title}
                        </Link>
                    ))}
                    {EXTERNAL_LINKS.map(({ path, icon }, index) => (
                        <div className="[&_svg]:h-6 [&_svg]:w-6">
                            <Link key={index} href={path}>
                                {icon}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
}
