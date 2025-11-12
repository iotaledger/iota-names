// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import * as amplitude from '@amplitude/analytics-browser';
import { LogLevel } from '@amplitude/analytics-core';

import { ampli } from './ampli';
import { consentBufferPlugin } from './consentBufferPlugin';

const IS_PROD_ENV = process.env.NODE_ENV === 'production';
const AMP_COOKIE_PREFIX = 'AMP_';

/**
 * Initialize Amplitude with consent buffer plugin.
 * This should be called once when the app starts.
 */
export async function initAmplitude(defaultNetwork: string) {
    await ampli.load({
        environment: 'iotanames',
        disabled: !IS_PROD_ENV,
        client: {
            configuration: {
                optOut: false, // Enable tracking by default; consent buffer plugin will handle queuing
                autocapture: true,
                logLevel: LogLevel.None,
            },
        },
    }).promise;

    if (ampli.client) {
        // IMPORTANT: Add the consent buffer plugin BEFORE any tracking calls
        // This ensures the plugin intercepts all events including identify
        await ampli.client.add(consentBufferPlugin).promise;

        setNetworkGroup(defaultNetwork);
    }

    // Flush events before page unload
    window.addEventListener('pagehide', () => {
        amplitude.setTransport('beacon');
        amplitude.flush();
    });
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
export function consentToAnalytics() {
    // Flush queued events and enable tracking
    consentBufferPlugin.flushQueue();

    if (ampli.client) {
        ampli.client.setOptOut(false);
    }
}

/**
 * Call this function when user declines cookies/tracking.
 * This will:
 * - Clear all queued events
 * - Disable event tracking
 * - Remove any existing Amplitude cookies
 */
export function declineAnalytics() {
    // Clear queued events
    consentBufferPlugin.clearQueue();

    // Disable tracking
    if (ampli.client) {
        ampli.client.setOptOut(true);
    }

    // Remove any existing Amplitude cookies
    removeAmplitudeCookies();
}

/**
 * Remove all Amplitude cookies from the browser
 */
function removeAmplitudeCookies() {
    if (typeof document === 'undefined') {
        return;
    }

    const amplitudeCookies = document.cookie
        .split('; ')
        .filter((cookie) => cookie.startsWith(AMP_COOKIE_PREFIX));

    for (const cookie of amplitudeCookies) {
        const cookieName = cookie.split('=')[0];
        // Remove cookie by setting expiry date in the past
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    }
}
