// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    CookieManager,
    useCookieManagerContext,
    type SKCMConfiguration,
} from '@boxfish-studio/react-cookie-manager';
import { useEffect } from 'react';

import { CONFIG } from '@/config';
import { ApiKey } from '@/lib/utils/analytics/ampli';
import { consentToAnalytics, initAmplitude } from '@/lib/utils/analytics/amplitude';

const defaultNetwork = CONFIG.network;

export function CookieDisclaimer() {
    const { servicesInitialized, showCookieDisclaimer } = useCookieManagerContext();

    useEffect(() => {
        if (!servicesInitialized.value || showCookieDisclaimer.value) return;

        (async () => {
            await initAmplitude(defaultNetwork);
            consentToAnalytics();
        })();
    }, [servicesInitialized.value, showCookieDisclaimer.value]);

    const configuration: SKCMConfiguration = {
        disclaimer: {
            title: undefined,
            body: 'By using IOTA Names site, you agree with our use of cookies. ',
            policyText: 'Read our Cookie Policy',
            policyUrl: '/cookie-policy',
            acceptButtonText: 'Accept',
            rejectButtonText: 'Decline',
        },
        services: {
            customNecessaryCookies: [
                {
                    name: 'AMP_' + ApiKey.iotanames.slice(0, 10),
                    purpose: 'Amplitude Analytics - necessary for basic website functionality',
                    expiry: '1 year',
                    type: 'http',
                    showDisclaimerIfMissing: true,
                },
                {
                    name: 'AMP_' + 'MKTG_' + ApiKey.iotanames.slice(0, 10),
                    purpose: 'Amplitude Analytics - necessary for basic website functionality',
                    expiry: '1 year',
                    type: 'http',
                    showDisclaimerIfMissing: true,
                },
            ],
        },
    };

    return <CookieManager configuration={configuration} />;
}
