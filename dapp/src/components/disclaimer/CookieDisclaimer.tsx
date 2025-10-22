// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookieManager, type SKCMConfiguration } from '@boxfish-studio/react-cookie-manager';
import { useEffect } from 'react';

import { CONFIG } from '@/config';
import { ampli } from '@/lib/utils/analytics/ampli';
import {
    consentToAnalytics,
    declineAnalytics,
    initAmplitude,
} from '@/lib/utils/analytics/amplitude';

import { PrivacyPolicyDialog } from '../dialogs/PrivacyPolicyDialog';

const defaultNetwork = CONFIG.network;

export function CookieDisclaimer() {
    useAnalytics();

    const configuration: SKCMConfiguration = {
        disclaimer: {
            title: undefined,
            body: 'We use cookies and analytics tools to help us improve your experience. Please accept analytics cookies to allow us to collect anonymous usage statistics. You can learn more in our ',
            policyText: 'Privacy Policy',
            onPolicyClick: () => {
                const current = new URL(window.location.href);
                current.searchParams.set('modal', 'privacy_policy');
                window.history.replaceState({}, '', current.toString());
                window.dispatchEvent(new PopStateEvent('popstate'));
            },
        },
        services: {
            customNecessaryCookies: [
                {
                    name: 'AMP_COOKIES_ACCEPTED',
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
            document.cookie = 'AMP_COOKIES_ACCEPTED=false; max-age=31536000 ';
        },
    };

    return (
        <>
            <CookieManager configuration={configuration} />
            <PrivacyPolicyDialog configuration={configuration} />
        </>
    );
}

function useAnalytics() {
    useEffect(() => {
        // Skip if already initialized
        if (ampli.isLoaded) {
            return;
        }
        initAmplitude(defaultNetwork);
    }, [ampli.isLoaded]);
}
