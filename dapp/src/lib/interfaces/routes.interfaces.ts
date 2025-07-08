// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export type BaseRoute = {
    path: string;
    icon?: JSX.Element;
    title?: string;
};

export type PublicRoute = BaseRoute & {
    isProtected?: false;
};

export type ProtectedRoute = BaseRoute & {
    isProtected: true;
    id: string;
};

export type Route = PublicRoute | ProtectedRoute;
