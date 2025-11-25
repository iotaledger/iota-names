// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookiePolicySection } from '@/components/CookiePolicySection';
import { configuration } from '@/components/disclaimer/CookieDisclaimer';

export default function CookiePolicy() {
    return (
        <>
            <CookiePolicySection configuration={configuration} />
        </>
    );
}
