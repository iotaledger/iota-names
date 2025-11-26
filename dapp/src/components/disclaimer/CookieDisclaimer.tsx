// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { CookieManager, type SKCMConfiguration } from '@boxfish-studio/react-cookie-manager';
import { Close } from '@iota/apps-ui-icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { FOOTER_LEGAL_LINKS } from '@/lib/constants';
import {
    getAmplitudeConsentStatus,
    onAmplitudeConsentAccepted,
    onAmplitudeConsentDeclined,
} from '@/lib/utils/analytics/amplitude';
import { AMP_COOKIES_KEY } from '@/lib/utils/analytics/constants';

const TEXT = 'By using this website, you agree with our ';

export function CookieDisclaimer() {
    const [amplitudeConsentStatus, setAmplitudeConsentStatus] = useState<
        'pending' | 'accepted' | 'declined' | null
    >(null);
    const router = useRouter();

    useEffect(() => {
        setAmplitudeConsentStatus(getAmplitudeConsentStatus());
    }, []);

    const configuration: SKCMConfiguration = {
        disclaimer: {
            title: undefined,
            body: TEXT,
            policyText: 'Privacy Policy',
            acceptButtonText: 'Close',
            policyUrl: '/privacy-policy',
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

    const handleLegalClick = (e: React.MouseEvent, path: string) => {
        const url = new URL(path, window.location.href);
        const modal = url.searchParams.get('modal');
        if (modal === 'terms_conditions' || modal === 'privacy_policy') {
            e.preventDefault();
            router.replace(path, { scroll: false });
        }
    };
    return (
        <>
            <div className="hidden">
                <CookieManager configuration={configuration} />
            </div>
            {amplitudeConsentStatus === 'pending' && (
                <div id="skcm-cookie-disclaimer">
                    <div id="skcm-cookie-disclaimer__body">
                        {TEXT}
                        {FOOTER_LEGAL_LINKS.map(({ title, path }, index) => {
                            return (
                                <React.Fragment key={title}>
                                    <Link
                                        href={path}
                                        onClick={(e) => {
                                            if (path.startsWith('?modal')) {
                                                handleLegalClick(e, path);
                                            }
                                        }}
                                        className="hover:text-names-primary-80 transition-colors duration-200"
                                    >
                                        {title}
                                    </Link>
                                    {index < FOOTER_LEGAL_LINKS.length - 1 ? ', ' : '.'}
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <div
                        onClick={() => {
                            onAmplitudeConsentAccepted();
                            setAmplitudeConsentStatus('accepted');
                        }}
                        className="absolute right-2 top-2 inline-flex cursor-pointer items-center justify-center rounded-full p-xs !mt-0 text-iota-neutral-100 outline-none hover:text-iota-neutral-92"
                    >
                        <Close className="h-5 w-5" aria-label="Close" />
                    </div>
                </div>
            )}
        </>
    );
}
