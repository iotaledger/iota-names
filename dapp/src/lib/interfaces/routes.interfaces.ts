// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export interface Route {
    title?: string;
    path: string;
    icon?: JSX.Element;
    id?: string;
}

export interface PublicRoute extends Pick<Route, 'path'> {}
