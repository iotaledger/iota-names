// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookieManager, type SKCMConfiguration } from '@boxfish-studio/react-cookie-manager';
import { useEffect } from 'react';

import { CONFIG } from '@/config';
import {
    consentToAnalytics,
    declineAnalytics,
    initAnalytics,
} from '@/lib/utils/analytics/amplitude';

const defaultNetwork = CONFIG.network;

export function CookieDisclaimer() {
    useEffect(() => {
        initAnalytics(defaultNetwork);
    }, []);

    const configuration: SKCMConfiguration = {
        disclaimer: {
            title: undefined,
            body: 'We use cookies and analytics tools to help us improve your experience. Please accept analytics cookies to allow us to collect anonymous usage statistics. You can learn more in our ',
            policyText: 'Privacy Policy',
        },
        services: {
            customNecessaryCookies: [
                {
                    name: 'AMP_COOKIES_ACEPTED',
                    purpose:
                        'Flag indicating that Amplitude analytics cookies may be created after consent',
                    expiry: '1 year',
                    type: 'http',
                    showDisclaimerIfMissing: true,
                },
            ],
        },
        onAcceptCookies: () => {
            consentToAnalytics();
            document.cookie = 'AMP_COOKIES_ACCEPTED=true; max-age=31536000';
        },
        onDeclineCookies: () => {
            declineAnalytics();
        },
    };

    return <CookieManager configuration={configuration} />;
}
