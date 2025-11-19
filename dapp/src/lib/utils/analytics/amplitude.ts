// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { LogLevel } from '@amplitude/analytics-core';

import { CONFIG } from '@/config';

import { ampli } from './ampli';
import { AMP_COOKIES_KEY } from './constants';

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
                        pageViews: IS_ENABLED,
                        sessions: IS_ENABLED,
                    },
                    logLevel: LogLevel.None,
                },
            },
        }).promise;

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
    document.cookie = `${AMP_COOKIES_KEY}=true; max-age=31536000; path=/; SameSite=Strict`;
    await initAmplitude();
}

/**
 * Call this function when user declines cookies/tracking.
 * This will disable event tracking.
 */
export function onAmplitudeConsentDeclined() {
    document.cookie = `${AMP_COOKIES_KEY}=false; max-age=31536000; path=/; SameSite=Strict`;
}
