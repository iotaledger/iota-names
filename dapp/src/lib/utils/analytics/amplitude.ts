// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import * as amplitude from '@amplitude/analytics-browser';
import { type UserSession } from '@amplitude/analytics-types';

import { PersistableStorage } from '../persistableStorage';
import { ampli } from './ampli';

const IS_PROD_ENV = process.env.NODE_ENV === 'production';

export const persistableStorage = new PersistableStorage<UserSession>();

export async function initAmplitude(defaultNetwork: string) {
    await ampli.load({
        environment: 'iotanames',
        disabled: !IS_PROD_ENV,
        client: {
            configuration: {
                optOut: true, // Start with tracking disabled for GDPR compliance
            },
        },
    });

    if (ampli.client) {
        ampli.identify(undefined, {
            groups: {
                activeNetwork: defaultNetwork,
            },
        });
    }

    window.addEventListener('pagehide', () => {
        amplitude.setTransport('beacon');
        amplitude.flush();
    });
}

/**
 * Call this function when user gives consent for cookies/tracking
 * This enables tracking and persists the analytics data from memory to cookies
 */
export function consentToAnalytics() {
    if (ampli.client) {
        ampli.client.setOptOut(false);
    }

    persistableStorage.persist();
}

/**
 * Call this function when user declines cookies/tracking
 * This disables tracking and clears any stored data
 */
export function declineAnalytics() {
    if (ampli.client) {
        ampli.client.setOptOut(true);
    }

    persistableStorage.reset();
}

/**
 * Check if user has already given consent for analytics
 * This checks if there are existing Amplitude cookies
 */
export function hasAnalyticsConsent(): boolean {
    return persistableStorage.persist !== undefined && document.cookie.includes('AMP_');
}

/**
 * Initialize analytics with CMP integration
 * Call this after user interaction or when checking existing consent
 */
export async function initAnalyticsWithCMP(defaultNetwork: string) {
    const hasConsent = hasAnalyticsConsent();

    if (hasConsent) {
        await initAmplitude(defaultNetwork);
        if (ampli.client) {
            ampli.client.setOptOut(false);
        }
    } else {
        await initAmplitude(defaultNetwork);
    }
}
