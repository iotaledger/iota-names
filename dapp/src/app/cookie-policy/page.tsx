// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookieLibrary, useSubmitNecessaryCookies } from '@boxfish-studio/react-cookie-manager';
import { toast } from 'react-hot-toast';

import {
    onAmplitudeConsentAccepted,
    onAmplitudeConsentDeclined,
} from '@/lib/utils/analytics/amplitude';

export default function CookiePolicy() {
    const submitNecessaryCookies = useSubmitNecessaryCookies();
    async function handleAccept() {
        try {
            onAmplitudeConsentAccepted();
            submitNecessaryCookies('true');
        } finally {
            toast.success('Your cookie preferences have been saved.');
        }
    }

    async function handleDecline() {
        try {
            onAmplitudeConsentDeclined();
            submitNecessaryCookies('false');
        } finally {
            toast.success('Your cookie preferences have been saved.');
        }
    }
    return (
        <section className="cookie-policy-page">
            <CookieLibrary
                configuration={{
                    onAcceptCookies: handleAccept,
                    onDeclineCookies: handleDecline,
                }}
            />
        </section>
    );
}
