// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { toast } from 'react-hot-toast';

import { CookiePolicyContent } from '@/components/cookie-policy/CookiePolicyContent';
import {
    onAmplitudeConsentAccepted,
    onAmplitudeConsentDeclined,
} from '@/lib/utils/analytics/amplitude';
import { AMP_COOKIES_KEY } from '@/lib/utils/analytics/constants';

export default function CookiePolicy() {
    async function handleConsentAccepted() {
        await onAmplitudeConsentAccepted();
        toast.success('Your cookie preferences have been saved.');
    }

    async function handleConsentDeclined() {
        onAmplitudeConsentDeclined();
        toast.success('Your cookie preferences have been saved.');
    }
    return (
        <section className="cookie-policy-page">
            <CookiePolicyContent
                consentKey={AMP_COOKIES_KEY}
                necessaryCookies={[
                    {
                        name: AMP_COOKIES_KEY,
                        purpose: 'Session management cookie for IOTA applications',
                        provider: 'IOTA',
                        category: 'Necessary',
                    },
                    {
                        name: 'AMP_*',
                        purpose: 'Amplitude analytics cookies',
                        provider: 'Amplitude',
                        category: 'Analytics',
                    },
                ]}
                onAccept={handleConsentAccepted}
                onReject={handleConsentDeclined}
            />
        </section>
    );
}
