// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { SKCMConfiguration, useSubmitNecessaryCookies } from '@boxfish-studio/react-cookie-manager';
import { Button, ButtonType } from '@iota/apps-ui-kit';
import CookiePolicy from '@legal/cookiePolicy.mdx';
import toast from 'react-hot-toast';

export function CookiePolicySection({ configuration }: { configuration: SKCMConfiguration }) {
    const { onAcceptCookies, onDeclineCookies } = configuration;
    const submitNecessaryCookies = useSubmitNecessaryCookies();

    async function handleAccept() {
        try {
            onAcceptCookies?.();
            submitNecessaryCookies('true');
        } finally {
            toast.success('Your cookie preferences have been saved.');
        }
    }

    async function handleDecline() {
        try {
            onDeclineCookies?.();
            submitNecessaryCookies('false');
        } finally {
            toast.success('Your cookie preferences have been saved.');
        }
    }

    return (
        <>
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
                    <Button onClick={handleAccept} text="Accept all" type={ButtonType.Primary} />
                    <Button onClick={handleDecline} text="Reject all" type={ButtonType.Secondary} />
                </div>
            </div>
        </>
    );
}
