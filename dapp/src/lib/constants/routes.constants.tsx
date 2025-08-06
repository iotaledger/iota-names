// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Discord, SmX } from '@iota/apps-ui-icons';

import { ProtectedRouteTitle } from '../enums';
import type { Route } from '../interfaces';

export const MY_NAMES_ROUTE: Route = {
    title: ProtectedRouteTitle.MyNames,
    path: '/my-names',
    id: 'my-names',
    isProtected: true,
};

export const AUCTION_ROUTE: Route = {
    title: ProtectedRouteTitle.Auction,
    path: '/auction',
    id: 'auction',
    isProtected: true,
};

export const PROTECTED_ROUTES = [MY_NAMES_ROUTE, AUCTION_ROUTE] as const satisfies Route[];

export const PUBLIC_ROUTES: Route[] = [AUCTION_ROUTE] as const satisfies Route[];

export const CONNECT_ROUTE: Route = {
    path: '/',
};

export const FOOTER_SOCIAL_LINKS: Route[] = [
    {
        path: 'https://discord.iota.org/',
        icon: <Discord />,
    },
    {
        path: 'https://x.com/iota',
        icon: <SmX />,
    },
];

export const FOOTER_LEGAL_LINKS: Route[] = [
    {
        title: 'Terms & Conditions',
        path: '/?modal=terms_conditions',
    },
    {
        title: 'Privacy Policy',
        path: '',
    },
];
