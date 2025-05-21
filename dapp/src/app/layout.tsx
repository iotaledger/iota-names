// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { Metadata } from 'next';

import '@iota/dapp-kit/dist/index.css';
import './globals.css';

import { AppProviders } from '@/providers';

export const metadata: Metadata = {
    title: 'IOTA Names dapp',
    description: 'IOTA Names dapp',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
