// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import TOS from '@legal/tos.mdx';

export default function Page(): React.JSX.Element {
    return (
        <main className="flex flex-col min-h-screen">
            <div className="container w-full h-full pt-20 flex flex-col flex-1">
                <div className="flex flex-col w-full gap-y-lg py-lg flex-1">
                    <span className="text-label-md text-names-neutral-70">
                        Effective Date: 25 August 2025
                    </span>
                    <div className="text-body-md text-names-neutral-92">
                        <TOS />
                    </div>
                </div>
            </div>
        </main>
    );
}
