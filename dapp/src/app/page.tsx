// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { AvailabilityCheck } from '@/components/AvailabilityCheck';

export default function Home() {
    return (
        <main className="flex flex-col h-screen">
            <div className="container w-full h-full py-12 flex">
                <AvailabilityCheck />
            </div>
        </main>
    );
}
