// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookieManager, type SKCMConfiguration } from '@boxfish-studio/react-cookie-manager';

import { CONFIG } from '@/config';
import {
    consentToAnalytics,
    declineAnalytics,
    initAnalyticsWithCMP,
} from '@/lib/utils/analytics/amplitude';

const defaultNetwork = CONFIG.network;

export function CookieDisclaimer() {
    initAnalyticsWithCMP(defaultNetwork);

    const configuration: SKCMConfiguration = {
        disclaimer: {
            title: undefined,
            body: 'By using IOTA Names site, you agree with our use of cookies. ',
            policyText: 'Read our Cookie Policy',
            policyUrl: '',
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
