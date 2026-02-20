// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Auctions page is hidden from UI but code is preserved.
 * This page redirects to home to prevent direct URL access.
 */
export default function AuctionsPage(): null {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null;
}
