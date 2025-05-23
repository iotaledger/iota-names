// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ConnectButton } from '@iota/dapp-kit';

import { AvailabilityCheck } from '@/components/AvailabilityCheck';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function Home() {
    return (
        <main className="flex flex-col h-screen">
            <div className="flex relative justify-between p-4">
                <h1 className="flex items-center text-headline-sm">IOTA NAMES</h1>
                <div className="flex items-center space-x-2">
                    <ThemeSwitcher />
                    <ConnectButton connectText="Connect" />
                </div>
            </div>
            <div className="container w-full h-full py-12 flex">
                <AvailabilityCheck />
            </div>
        </main>
    );
}
