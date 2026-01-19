// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useState, type ReactNode } from 'react';

import { Navbar } from '@/components/layout';
import { TestModeBanner } from '@/components/TestModeBanner';

export function StickyHeader({ children }: { children: ReactNode }) {
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    return (
        <>
            <TestModeBanner
                isBannerVisible={isBannerVisible}
                onDismiss={() => setIsBannerVisible(false)}
            />
            <Navbar isBannerVisible={isBannerVisible} />
            {children}
        </>
    );
}
