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
import TOS from '@legal/tos.mdx';
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
                <Header title="Cookie Preferences" onClose={handleClose} />

                <DialogBody>
                    <div className="flex flex-col gap-xl">
                        <div className="flex flex-col gap-md">
                            <div className="text-body-md text-names-neutral-92">
                                <TOS />
                            </div>
                        </div>

                        <div className="flex flex-row justify-end gap-md mt-lg">
                            <Button
                                onClick={handleDecline}
                                text="Reject all"
                                type={ButtonType.Secondary}
                                disabled={loading}
                            />
                            <Button
                                onClick={handleAccept}
                                text="Accept all"
                                type={ButtonType.Primary}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
