// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Dialog, DialogContent } from '@iota/apps-ui-kit';

import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

import { AvailabilityCheck } from './AvailabilityCheck';

export function AvailabilityCheckDialog() {
    const { isOpen, close, props } = useAvailabilityCheckDialog();

    return (
        <Dialog open={isOpen} onOpenChange={() => close()}>
            <DialogContent
                isFixedPosition
                showCloseOnOverlay
                customWidth="w-[60vw] h-[clamp(400px,80vh,700px)]"
            >
                <div className="flex flex-col gap-md px-48 py-20 flex-1">
                    <AvailabilityCheck {...props} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
