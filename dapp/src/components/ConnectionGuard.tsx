// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
'use client';

import { LoadingIndicator } from '@iota/apps-ui-kit';
import { PropsWithChildren } from 'react';

import { useConnectionGuard } from '@/hooks';

export function ConnectionGuard({ children }: PropsWithChildren) {
    const { autoConnect, needRedirect } = useConnectionGuard();

    if (autoConnect === 'idle' || needRedirect) {
        return (
            <div className="flex h-screen w-full justify-center items-center">
                <LoadingIndicator size="w-16 h-16" />
            </div>
        );
    }

    return autoConnect === 'attempted' ? children : null;
}
