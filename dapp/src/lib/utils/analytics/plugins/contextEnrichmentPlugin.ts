// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/**
 * Context Enrichment Plugin for Amplitude Analytics
 *
 * Enriches analytics events with UI context (page URL, dialog title, etc.) and
 * handles environment-based event prefixing for development/production separation.
 *
 * Uses event capture phase to snapshot UI state before handlers modify the DOM,
 * solving the timing issue where analytics events are processed after UI changes.
 * Cached snapshots (1s TTL) are used during async event processing.
 *
 * To add new context properties:
 * 1. Extend ContextSnapshot interface in contextSnapshotCache.ts
 * 2. Update captureContextSnapshot() to extract the property
 * 3. Update enrichEventWithContext() to add it to events
 * 4. Add the property to ALLOWED_PROPERTIES constant
 */

import type { BrowserConfig, EnrichmentPlugin, Event } from '@amplitude/analytics-types';

import {
    ALLOWED_BUTTON_TEXT_PATTERNS,
    ALLOWED_BUTTON_TEXTS,
    ALLOWED_LINK_PATTERNS,
} from '../constants';
import type { ContextSnapshot } from './contextSnapshotCache';
import { contextSnapshotCache } from './contextSnapshotCache';

// Environment detection
const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_BUILD_ENV !== 'production';
const DEV_EVENT_PREFIX = 'dev_';

/** Page paths mapped to custom Amplitude event names. */
const PAGE_VIEW_EVENTS_MAP: Record<string, string> = {
    '/': 'Landing Page Viewed',
    '/my-names': 'My Names Page Viewed',
    '/auctions': 'Auctions Page Viewed',
    '/search': 'Search Page Viewed',
    '/privacy-policy': 'Privacy Policy Page Viewed',
    '/terms-of-service': 'Terms of Service Page Viewed',
    '/cookie-policy': 'Cookie Policy Page Viewed',
};

/** Whitelisted event properties allowed to be sent to Amplitude. */
const ALLOWED_PROPERTIES = {
    PAGE_URL: 'page_url',
    DIALOG_TITLE: 'dialog_title',
    ELEMENT_TAG: '[Amplitude] Element Tag',
    ELEMENT_TEXT: '[Amplitude] Element Text',
    ELEMENT_HREF: '[Amplitude] Element Href',
} as const;

const EVENT_TYPE = {
    PAGE_VIEW: '[Amplitude] Page Viewed',
    ELEMENT_CLICK: '[Amplitude] Element Clicked',
} as const;

type ExtendedEventProperties = Event & {
    [key: string]: string;
};

type EnrichedEventProperties = ExtendedEventProperties & {
    page_url: string;
    dialog_title?: string;
};

/** Extract the title of the currently open dialog from the DOM. */
function extractDialogTitle(): string | null {
    const dialog = document.querySelector('div[role="dialog"].dialog-content-bg');
    if (!dialog) {
        return null;
    }

    const title = dialog.querySelector('.header-bg-color span.text-title-lg')?.textContent?.trim();
    return title || null;
}

/** Capture a snapshot of the current UI context. Called during event capture phase. */
function captureContextSnapshot(): ContextSnapshot {
    return {
        dialogTitle: extractDialogTitle(),
        timestamp: Date.now(),
    };
}

/** Handle click events during capture phase to snapshot UI context before handlers modify it. */
function handleCapturePhaseClick(event: MouseEvent): void {
    if (event.type !== 'click') return;

    const snapshot = captureContextSnapshot();
    contextSnapshotCache.set(snapshot);
}

/** Set up event listeners to capture UI context before user interactions. Returns cleanup function. */
function setupContextCapture(): () => void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return () => {};
    }

    document.addEventListener('click', handleCapturePhaseClick, true);

    return () => {
        document.removeEventListener('click', handleCapturePhaseClick, true);
    };
}

// const ALLOWED_URLS = [];

/** Replace address patterns and dynamic text with placeholders, or return allowed text as-is. */
function maskText(text: string): string {
    if (isTextAllowed(text)) {
        return text.toLowerCase();
    }

    const patternMatch = matchPattern(text);
    if (patternMatch) {
        return patternMatch;
    }

    return '';
}

function isTextAllowed(text: string): boolean {
    return ALLOWED_BUTTON_TEXTS.some((at) => at?.toLowerCase() === text?.toLowerCase());
}

function matchPattern(text: string): string | null {
    for (const { pattern, replaceTo } of ALLOWED_BUTTON_TEXT_PATTERNS) {
        if (pattern.test(text)) {
            return replaceTo;
        }
    }
    return null;
}

function matchLinkPattern(url: string): string | null {
    for (const { pattern, replaceTo } of ALLOWED_LINK_PATTERNS) {
        if (pattern.test(url)) {
            return replaceTo;
        }
    }
    return null;
}

function getPageViewEventName(path: string): string | null {
    return PAGE_VIEW_EVENTS_MAP[path] || null;
}

function isElementTag(event: Event, tagName: string): boolean {
    return (
        (event.event_properties as ExtendedEventProperties)?.[ALLOWED_PROPERTIES.ELEMENT_TAG] ===
        tagName
    );
}

function getClickedElementEventName(event: Event): string | null {
    const clickedElementText = (event.event_properties as ExtendedEventProperties)?.[
        ALLOWED_PROPERTIES.ELEMENT_TEXT
    ];
    const clickedElementUrl = (event.event_properties as ExtendedEventProperties)?.[
        ALLOWED_PROPERTIES.ELEMENT_HREF
    ];

    const isClickedLink = isElementTag(event, 'a');
    if (isClickedLink && (clickedElementText || clickedElementUrl)) {
        // Prioritize URL pattern matching for links
        if (clickedElementUrl) {
            const urlMatch = matchLinkPattern(clickedElementUrl);
            if (urlMatch) {
                return `${urlMatch} Link Clicked`;
            }
        }
        // Fallback to text matching if URL doesn't match or isn't present
        const text = clickedElementText || clickedElementUrl || '';
        const maskedText = maskText(text);
        return maskedText ? `${maskedText} Link Clicked` : null;
    }

    const isClickedButton = isElementTag(event, 'button');
    if (isClickedButton && clickedElementText) {
        const maskedText = maskText(clickedElementText);
        return maskedText ? `${maskedText} Button Clicked` : null;
    }

    return null;
}

/** Filter event properties to only include whitelisted properties. */
function filterProperties(eventProperties: EnrichedEventProperties): EnrichedEventProperties {
    const filteredProperties: EnrichedEventProperties = { ...eventProperties };
    const allowedValues = Object.values(ALLOWED_PROPERTIES) as string[];

    Object.keys(filteredProperties).forEach((key) => {
        if (!allowedValues.includes(key)) {
            delete filteredProperties[key];
        }
    });

    return filteredProperties;
}

/** Enrich event with UI context. Uses cached context first, falls back to current DOM state. */
function enrichEventWithContext(eventProperties: EnrichedEventProperties): EnrichedEventProperties {
    const cachedContext = contextSnapshotCache.get();
    const dialogTitle = cachedContext?.dialogTitle ?? extractDialogTitle();

    if (dialogTitle) {
        eventProperties.dialog_title = dialogTitle;
    }

    return eventProperties;
}

/**
 * Amplitude enrichment plugin that adds UI context to all events and handles environment separation.
 * Enriches events with page URL, dialog title, custom event names, and development prefixing.
 */
export function contextEnrichmentPlugin(): EnrichmentPlugin {
    let cleanupContextCapture: (() => void) | null = null;

    return {
        name: 'context-enrichment',
        type: 'enrichment',

        /** Initialize the plugin and set up context capture listeners. */
        setup: async (_config: BrowserConfig) => {
            cleanupContextCapture = setupContextCapture();
            return Promise.resolve();
        },

        /** Enrich each event with contextual information before sending to Amplitude. */
        execute: async (event: Event): Promise<Event> => {
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                return event;
            }

            const enrichedEventProperties = {
                ...event.event_properties,
            } as EnrichedEventProperties;

            // Transform page view events to custom named events
            if (event.event_type === EVENT_TYPE.PAGE_VIEW) {
                const path = window.location.pathname;
                const pageEventName = getPageViewEventName(path);
                if (pageEventName) {
                    event.event_type = pageEventName;
                }
            }

            // Transform element click events to custom named events
            if (event.event_type === EVENT_TYPE.ELEMENT_CLICK) {
                const elementClickedEventName = getClickedElementEventName(event);
                if (elementClickedEventName) {
                    event.event_type = elementClickedEventName;
                }
            }

            enrichedEventProperties.page_url = window.location.href;
            enrichEventWithContext(enrichedEventProperties);

            const filteredProperties = filterProperties(enrichedEventProperties);

            // Environment handling - add prefix
            if (
                IS_DEVELOPMENT &&
                event.event_type &&
                !event.event_type.startsWith(DEV_EVENT_PREFIX)
            ) {
                event.event_type = DEV_EVENT_PREFIX + event.event_type;
            }

            return {
                ...event,
                event_properties: filteredProperties,
            };
        },

        /** Clean up event listeners and cache when the plugin is removed. */
        teardown: async () => {
            if (cleanupContextCapture) {
                cleanupContextCapture();
            }
            contextSnapshotCache.clear();
            return Promise.resolve();
        },
    };
}
