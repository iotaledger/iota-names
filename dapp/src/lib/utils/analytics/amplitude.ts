// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { LogLevel } from '@amplitude/analytics-core';

import { ampli } from './ampli';
import { consentBufferPlugin } from './consentBufferPlugin';

const IS_PROD_ENV =
    process.env.NEXT_PUBLIC_BUILD_ENV === 'production' &&
    process.env.NEXT_PUBLIC_VERCEL_ENVIRONMENT === 'production';
console.log('nodenv', process.env.NEXT_PUBLIC_BUILD_ENV);
console.log('vercelenv', process.env.NEXT_PUBLIC_VERCEL_ENVIRONMENT);
/**
 * Initialize Amplitude with consent buffer plugin.
 * This should be called once when the app starts.
 * Multiple calls to this function are safe - subsequent calls will be ignored.
 */
export async function initAmplitude(defaultNetwork: string) {
    if (ampli.isLoaded) {
        return;
    }

    try {
        await ampli.load({
            environment: 'iotanames',
            disabled: !IS_PROD_ENV,
            client: {
                configuration: {
                    optOut: false, // Enable tracking by default; consent buffer plugin will handle queuing
                    autocapture: {
                        pageViews: IS_PROD_ENV,
                        sessions: IS_PROD_ENV,
                    },
                    logLevel: LogLevel.None,
                },
            },
        }).promise;

        await ampli.client.add(consentBufferPlugin).promise;
        setNetworkGroup(defaultNetwork);

        window.addEventListener('pagehide', () => {
            consentBufferPlugin.flushQueue();
        });
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
 * This will:
 * - Flush all queued events to Amplitude
 * - Enable future event tracking
 * - Allow Amplitude to create cookies
 */
export function onAmplitudeConsentAccepted() {
    consentBufferPlugin.acceptCookies();
    ampli?.client?.setOptOut(false);
    consentBufferPlugin.flushQueue();
}

/**
 * Call this function when user declines cookies/tracking.
 * This will:
 * - Clear all queued events
 * - Disable event tracking
 * - Remove any existing Amplitude cookies
 */
export function onAmplitudeConsentDeclined() {
    consentBufferPlugin.declineCookies();
    ampli?.client?.setOptOut(true);
    consentBufferPlugin.clearQueue();
}
