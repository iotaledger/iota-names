// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import '@iota/dapp-kit/dist/index.css';
import './globals.css';

import { AvailabilityCheckDialog } from '@/components/availability-check/AvailabilityCheckDialog';
import { TermsAndConditionsDialog } from '@/components/dialogs/TermsAndConditionsDialog';
import { Footer, Navbar } from '@/components/layout';
import { DEFAULT_METADATA } from '@/lib/constants/metadata.constants';
import { APP_STATIC_THEME } from '@/lib/constants/theme.constants';
import { AppProviders } from '@/providers';
import { Suspense } from 'react';

export const metadata = DEFAULT_METADATA;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={APP_STATIC_THEME}>
            <body className="antialiased">
                <AppProviders>
                    <Navbar />
                    {children}
                    <AvailabilityCheckDialog />
                    <Footer />
                    <Suspense>
                        <TermsAndConditionsDialog />
                    </Suspense>
                </AppProviders>
            </body>
        </html>
    );
}
