// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Discord } from '@iota/apps-ui-icons';

import { X } from '@/public/icons';

import { ProtectedRouteTitle } from '../enums';
import type { PublicRoute, Route } from '../interfaces';

export const MY_NAMES_ROUTE: Route = {
    title: ProtectedRouteTitle.MyNames,
    path: '/my-names',
    id: 'my-names',
};

export const PROTECTED_ROUTES = [MY_NAMES_ROUTE] as const satisfies Route[];

export const CONNECT_ROUTE: PublicRoute = {
    path: '/',
};

export const FOOTER_EXTERNAL_LINKS: Route[] = [
    {
        path: 'https://discord.iota.org/',
        icon: <Discord />,
    },
    {
        path: 'https://x.com/iota',
        icon: <X />,
    },
];

export const FOOTER_USE_CONDITIONS_LINKS: Route[] = [
    {
        title: 'Terms & Conditions',
        path: '',
    },
    {
        title: 'Privacy Policy',
        path: '',
    },
];
