// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookieManagerProvider } from '@boxfish-studio/react-cookie-manager';

export function ContextProviders({ children }: React.PropsWithChildren): React.JSX.Element {
    return <CookieManagerProvider>{children}</CookieManagerProvider>;
}
