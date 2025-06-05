// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { ProtectedRouteTitle } from '../enums';
import type { ProtectedRoute, PublicRoute } from '../interfaces';

export const MY_NAMES_ROUTE: ProtectedRoute = {
    title: ProtectedRouteTitle.MyNames,
    path: '/my-names',
    id: 'my-names',
};

export const PROTECTED_ROUTES = [MY_NAMES_ROUTE] as const satisfies ProtectedRoute[];

export const CONNECT_ROUTE: PublicRoute = {
    path: '/',
};
