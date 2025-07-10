// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { ArrowRight } from '@iota/apps-ui-icons';
import cx from 'clsx';
import Link from 'next/link';
import React from 'react';

const ROUTE_STYLES = 'text-headline-md font-bold leading-[120%] -tracking-[0.4px]';

const ACTIVE_ROUTE_COLOR = 'text-names-neutral-92 ';

export interface BreadcrumbItem {
    label: string;
    path: string;
    isActive?: boolean;
    testId?: string;
    onClick?: () => void;
}

interface BreadcrumbsProps {
    items: (BreadcrumbItem | undefined)[];
    trailingElement?: React.ReactNode;
}

export function Breadcrumbs({ items, trailingElement }: BreadcrumbsProps): React.JSX.Element {
    const filteredItems = items.filter((item) => !!item);
    return (
        <nav className="flex flex-row items-center gap-x-md">
            <ol className="flex flex-row items-center gap-x-xs">
                {filteredItems.map((item, index) => (
                    <li key={index} className="flex flex-row items-center gap-x-xs">
                        <Link
                            href={item.path}
                            onClick={item.onClick}
                            className={cx(
                                ROUTE_STYLES,
                                item.isActive ? ACTIVE_ROUTE_COLOR : 'text-names-neutral-70',
                                'hover:text-names-neutral-92 transition-colors duration-200',
                            )}
                        >
                            {item.label}
                        </Link>

                        {index < filteredItems.length - 1 && (
                            <span className={ROUTE_STYLES}>
                                <ArrowRight className="w-6 h-6" />
                            </span>
                        )}
                    </li>
                ))}
            </ol>
            {trailingElement}
        </nav>
    );
}
