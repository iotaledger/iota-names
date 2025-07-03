// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link';

import { FOOTER_EXTERNAL_LINKS, FOOTER_USE_CONDITIONS_LINKS } from '@/lib/constants';
import { NamesLogoBranded } from '@/public/icons';

export function Footer() {
    const COPYRIGHT_YEAR = new Date().getFullYear();
    return (
        <footer className="w-full bg-names-neutral-6 py-lg">
            <div className="container flex flex-col sm:flex-row justify-between items-center gap-y-lg">
                <div className="flex items-center gap-sm">
                    <NamesLogoBranded className="w-[14.71px] h-[22.97px]" />
                    <span className="text-iota-neutral-70 text-label-sm tracking-normal">
                        © {COPYRIGHT_YEAR} IOTA Names. All Rights Reserved.
                    </span>
                </div>
                <div className="flex flex-row gap-md items-center text-iota-neutral-70 text-body-md">
                    {FOOTER_USE_CONDITIONS_LINKS.map(({ path, title }) => (
                        <Link
                            key={title}
                            href={path}
                            className="hover:text-names-primary-80 transition-colors duration-200"
                        >
                            {title}
                        </Link>
                    ))}
                    {FOOTER_EXTERNAL_LINKS.map(({ path, icon }, index) => (
                        <div className="[&_svg]:h-6 [&_svg]:w-6">
                            <Link key={index} href={path} target="_blank" rel="noopener noreferrer">
                                {icon}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
}
