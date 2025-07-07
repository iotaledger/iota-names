// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Dialog, DialogContent, Input, InputType } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AvailabilityCheck } from './AvailabilityCheck';

export function LandingHero() {
    const [isDialogOpen, setDialogOpen] = useState(false);

    function toggleDialog() {
        setDialogOpen(!isDialogOpen);
    }

    return (
        <>
            <div className="landing-background">
                <div className="container w-full h-full py-12 flex flex-col items-center justify-center gap-y-2xl min-h-[560px]">
                    <div className="flex flex-col gap-md">
                        <h1 className="text-display-md -tracking-[0.4px]">Your On-Chain Name</h1>
                        <p className="text-title-lg leading-5 -tracking-[0.4px]">
                            Own a unique, human-readable name on IOTA.
                        </p>
                    </div>

                    <div className="w-full max-w-2xl flex flex-col backdrop-blur-md bg-white/5 rounded-lg overflow-hidden">
                        <Input
                            placeholder="Search for your IOTA name"
                            type={InputType.Text}
                            onFocus={toggleDialog}
                        />
                    </div>
                </div>
            </div>

            {isDialogOpen && (
                <Dialog open onOpenChange={toggleDialog}>
                    <DialogContent
                        showCloseOnOverlay
                        customWidth="w-[60vw] h-[clamp(400px,80vh,600px)]"
                    >
                        <div className="flex flex-col gap-md px-48 py-20 flex-1">
                            <AvailabilityCheck autoFocusInput />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
