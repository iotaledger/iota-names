// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Input, InputType, Video } from '@iota/apps-ui-kit';

import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

const TITLE = 'Your On-Chain Name';
const DESCRIPTION = 'Own a unique, human-readable name on IOTA.';

export function LandingHero() {
    const { open, close } = useAvailabilityCheckDialog();

    return (
        <div className="relative min-h-[560px] overflow-hidden">
            <Video
                src="/hero-landing.mp4"
                isAutoPlayEnabled
                disableControls
                className="absolute inset-0 w-full h-full object-cover z-[-1]"
                poster="/poster-hero.png"
            />

            <div className="container w-full h-full py-12 flex flex-col items-center justify-center gap-y-2xl">
                <div className="flex flex-col gap-md">
                    <h1 className="text-display-md -tracking-[0.4px]">{TITLE}</h1>
                    <p className="text-title-lg leading-5 -tracking-[0.4px]">{DESCRIPTION}</p>
                </div>

                <div className="w-full max-w-2xl flex flex-col backdrop-blur-md bg-white/5 rounded-lg overflow-hidden">
                    <Input
                        placeholder="Search for your IOTA name"
                        type={InputType.Text}
                        onFocus={() => open({ autoFocusInput: true, onCompleted: close })}
                    />
                </div>
            </div>
        </div>
    );
}
