// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ConnectButton } from '@iota/dapp-kit';

import { AvailabilityCheck } from '@/components/AvailabilityCheck';

export default function Home() {
    return (
        <main className="flex flex-col h-screen">
            <div className="flex relative justify-center m-4">
                <h1 className="flex items-center h-14 text-headline-sm">IOTA NAMES</h1>
                <div className="absolute right-0 h-full">
                    <div className="flex items-center h-full">
                        <ConnectButton connectText="Connect" />
                    </div>
                </div>
            </div>
            <div className="flex w-full items-center justify-center h-full p-8 pb-20 gap-16 sm:p-20">
                <AvailabilityCheck />
            </div>
        </main>
    );
}
