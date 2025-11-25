// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookieManager, type SKCMConfiguration } from '@boxfish-studio/react-cookie-manager';

import {
    onAmplitudeConsentAccepted,
    onAmplitudeConsentDeclined,
} from '@/lib/utils/analytics/amplitude';
import { AMP_COOKIES_KEY } from '@/lib/utils/analytics/constants';

export const configuration: SKCMConfiguration = {
    disclaimer: {
        title: undefined,
        body: 'By using this website, you agree with our use of cookies. See details in the ',
        policyText: 'Privacy Policy',
        acceptButtonText: 'Close',
        onPolicyClick: () => {
            window.location.href = '/privacy-policy';
        },
    },
    services: {
        customNecessaryCookies: [
            {
                name: AMP_COOKIES_KEY,
                purpose:
                    'Flag indicating that Amplitude analytics cookies may be created after consent',
                expiry: '1 year',
                type: 'http',
                showDisclaimerIfMissing: true,
            },
        ],
    },
    onAcceptCookies: () => {
        onAmplitudeConsentAccepted();
    },
    onDeclineCookies: () => {
        onAmplitudeConsentDeclined();
    },
};

export function CookieDisclaimer() {
    return (
        <>
            <CookieManager configuration={configuration} />
        </>
    );
}
