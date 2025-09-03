// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Dialog, DialogContent } from '@iota/apps-ui-kit';
import { useEffect } from 'react';

import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

import { AvailabilityCheck } from './AvailabilityCheck';

export function AvailabilityCheckDialog() {
    const { isOpen, close, props } = useAvailabilityCheckDialog();

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                document.body.style.pointerEvents = '';
            }, 0);

            return () => clearTimeout(timer);
        } else {
            document.body.style.pointerEvents = 'auto';
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={() => close()}>
            <DialogContent
                isFixedPosition
                showCloseOnOverlay
                customWidth="w-[90vw] h-[clamp(400px,90vh,700px)] lg:w-[60vw] lg:h-[clamp(400px,80vh,700px)]"
            >
                <div className="flex flex-col gap-md px-lg py-10 md:px-24 md:py-20 lg:px-48 flex-1">
                    <AvailabilityCheck {...props} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
