// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { SKCMConfiguration, useSubmitNecessaryCookies } from '@boxfish-studio/react-cookie-manager';
import {
    Button,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
} from '@iota/apps-ui-kit';
import CookiePolicy from '@legal/cookiePolicy.mdx';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function PrivacyPolicyDialog({ configuration }: { configuration: SKCMConfiguration }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const open = searchParams.get('modal') === 'privacy_policy';

    const { onAcceptCookies, onDeclineCookies } = configuration;
    const submitNecessaryCookies = useSubmitNecessaryCookies();
    const [loading, setLoading] = useState(false);

    function handleClose() {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('modal');
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    }

    async function handleAccept() {
        setLoading(true);
        try {
            onAcceptCookies?.();
            submitNecessaryCookies('true');
        } finally {
            setLoading(false);
            handleClose();
        }
    }

    async function handleDecline() {
        setLoading(true);
        try {
            onDeclineCookies?.();
            submitNecessaryCookies('false');
        } finally {
            setLoading(false);
            handleClose();
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) handleClose();
            }}
        >
            <DialogContent
                containerId="overlay-portal-container"
                position={DialogPosition.Center}
                isFixedPosition
                customWidth="w-full max-w-md md:max-w-2xl xl:max-w-[744px]"
            >
                <Header title="Privacy Policy" onClose={handleClose} />

                <DialogBody>
                    <div className="flex flex-col gap-xl mb-lg">
                        <div className="flex flex-col gap-md">
                            <span className="text-label-md text-names-neutral-70">
                                Last updated: 9th October 2025
                            </span>
                            <div className="text-body-md text-names-neutral-92">
                                <CookiePolicy />
                            </div>
                        </div>

                        <div className="flex flex-row justify-center gap-md">
                            <Button
                                onClick={handleAccept}
                                text="Accept all"
                                type={ButtonType.Primary}
                                disabled={loading}
                            />
                            <Button
                                onClick={handleDecline}
                                text="Reject all"
                                type={ButtonType.Secondary}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
