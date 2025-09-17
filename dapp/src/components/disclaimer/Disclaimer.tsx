// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Disclaimer as BfDisclaimer,
    CookieManager,
    DisclaimerConfiguration,
    useCookieManagerContext,
    type SKCMConfiguration,
} from '@boxfish-studio/react-cookie-manager';
import { use, useEffect } from 'react';

import { consentToAnalytics, declineAnalytics } from '@/lib/utils/analytics/amplitude';

interface DisclaimerProps {
    allowCookies?: () => void;
    declineCookies?: () => void;
}

export function Disclaimer({ allowCookies, declineCookies }: DisclaimerProps) {
    const { showCookieDisclaimer, servicesInitialized } = useCookieManagerContext();

    // console.log('dd', showCookieDisclaimer.value);
    const configuration: DisclaimerConfiguration = {
        title: 'This website uses cookies',
        body: 'By using this site, you agree with our use of cookies',
        // theme: {
        //     primary: '#0f1228',
        //     dark: '#adafc5',
        //     medium: '#ffaaff',
        //     light: '#fff',
        // },
    };

    const skcmConfig: SKCMConfiguration = {
        disclaimer: {
            title: 'This website uses cookies',
            body: 'By using this site, you agree with our use of cookies',
            rejectButtonText: 'Decline',
        },
    };

    console.log('servicesInitialized', servicesInitialized.value);

    if (!servicesInitialized.value) {
        return null;
    }

    // return (
    //     <BfDisclaimer
    //         configuration={configuration}
    //         allowCookies={() => {
    //             showCookieDisclaimer.setValue(true);
    //             // consentToAnalytics();
    //         }}
    //         declineCookies={() => declineAnalytics()}
    //     />
    // );

    return <CookieManager configuration={skcmConfig} />;
}
