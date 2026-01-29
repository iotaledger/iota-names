// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { LogLevel } from '@amplitude/analytics-core';
import { plugin as engagementPlugin } from '@amplitude/engagement-browser';

import { CONFIG } from '@/config';

import { ampli } from './ampli';
import { AMP_COOKIES_KEY } from './constants';
import { contextEnrichmentPlugin } from './plugins/contextEnrichmentPlugin';

const IS_ENABLED =
    process.env.NEXT_PUBLIC_BUILD_ENV === 'production' &&
    process.env.NEXT_PUBLIC_AMPLITUDE_ENABLED === 'true';

/**
 * Check if user has previously given consent for cookies/tracking.
 */
export function getAmplitudeConsentStatus() {
    if (typeof document === 'undefined') return 'pending';
    if (document.cookie.includes(`${AMP_COOKIES_KEY}=true`)) return 'accepted';
    if (document.cookie.includes(`${AMP_COOKIES_KEY}=false`)) return 'declined';
    return 'pending';
}

/**
 * Initialize Amplitude.
 * This should be called once when the app starts.
 * Multiple calls to this function are safe - subsequent calls will be ignored.
 */
export async function initAmplitude() {
    if (ampli.isLoaded) {
        return;
    }

    const defaultNetwork = CONFIG.network;

    try {
        await ampli.load({
            environment: 'iotanames',
            disabled: !IS_ENABLED,
            client: {
                configuration: {
                    autocapture: {
                        attribution: IS_ENABLED,
                        fileDownloads: IS_ENABLED,
                        formInteractions: IS_ENABLED,
                        pageViews: IS_ENABLED,
                        sessions: IS_ENABLED,
                        elementInteractions: IS_ENABLED
                            ? {
                                  cssSelectorAllowlist: ['button', 'a'],
                              }
                            : false,
                    },
                    logLevel: LogLevel.None,
                },
            },
        }).promise;
        ampli.client.add(engagementPlugin({ serverZone: 'EU' }));

        // Add context enrichment plugin to add page context to all events
        if (IS_ENABLED) {
            ampli.client.add(contextEnrichmentPlugin());
        }

        setNetworkGroup(defaultNetwork);
    } catch (error) {
        console.error('[Amplitude] Initialization failed:', error);
        throw error;
    }
}

function setNetworkGroup(network: string): void {
    ampli.client.setGroup('activeNetwork', network); // keep `activeNetwork` key for backward compatibility
}

/**
 * Call this function when user gives consent for cookies/tracking.
 * This will enable future event tracking.
 */
export async function onAmplitudeConsentAccepted() {
    setAmpliConsentAccepted();
    return initAmplitude();
}

export function setAmpliConsentAccepted() {
    document.cookie = `${AMP_COOKIES_KEY}=true; max-age=31536000; path=/; SameSite=Strict`;
}

/**
 * Call this function when user declines cookies/tracking.
 * This will disable event tracking and clear all Amplitude data.
 */
export function onAmplitudeConsentDeclined() {
    // First, opt out to prevent Amplitude from creating new cookies
    ampli.client.setOptOut(true);
    // Clear all Amplitude storage (localStorage and cookies)
    ampli.client.reset();
    cleanAmplitudeCookies();
    document.cookie = `${AMP_COOKIES_KEY}=false; max-age=31536000; path=/; SameSite=Strict`;
}

export function cleanAmplitudeCookies() {
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
        const cookieNameOrigin = cookie.split('=')[0].trim();
        const cookieNameLower = cookieNameOrigin.toLowerCase();
        if (
            cookieNameLower.startsWith('amp_') &&
            cookieNameLower !== AMP_COOKIES_KEY.toLowerCase()
        ) {
            document.cookie = `${cookieNameOrigin}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            document.cookie = `${cookieNameOrigin}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
            const domainParts = window.location.hostname.split('.');
            if (domainParts.length > 2) {
                const parentDomain = domainParts.slice(-2).join('.');
                document.cookie = `${cookieNameOrigin}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${parentDomain}`;
            }
        }
    });
}
