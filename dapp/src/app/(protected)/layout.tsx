// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Dialog, DialogContent } from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { redirect } from 'next/navigation';
import { useEffect, type PropsWithChildren } from 'react';

import { AvailabilityCheckDialog } from '@/components';
import { CONNECT_ROUTE } from '@/lib/constants';
import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

export default function ProtectedLayout({ children }: PropsWithChildren): JSX.Element {
    const currentAccount = useCurrentAccount();
    const { isOpen: isAvailabilityCheckDialogOpen, close, props } = useAvailabilityCheckDialog();

    useEffect(() => {
        if (!currentAccount) {
            redirect(CONNECT_ROUTE.path);
        }
    }, [currentAccount]);

    return (
        <main className="flex flex-col min-h-screen">
            <div className="container w-full h-full pt-20 flex flex-col flex-1">
                <div className="flex flex-col w-full gap-y-lg py-lg flex-1">{children}</div>

                {isAvailabilityCheckDialogOpen && (
                    <Dialog open onOpenChange={() => close()}>
                        <DialogContent
                            isFixedPosition
                            showCloseOnOverlay
                            customWidth="w-[60vw] h-[clamp(400px,80vh,600px)]"
                        >
                            <div className="flex flex-col gap-md px-48 py-20 flex-1">
                                <AvailabilityCheckDialog {...props} />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </main>
    );
}
