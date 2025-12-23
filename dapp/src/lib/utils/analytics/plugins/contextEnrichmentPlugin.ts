// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { BrowserConfig, EnrichmentPlugin, Event } from '@amplitude/analytics-types';

const PAGE_VIEW_EVENTS_MAP: Record<string, string> = {
    '/': 'Landing Page Viewed',
    '/my-names': 'My Names Page Viewed',
    '/auctions': 'Auctions Page Viewed',
    '/search': 'Search Page Viewed',
};

function extractDialogTitle(): string | null {
    const dialog = document.querySelector('div[role="dialog"].dialog-content-bg');

    if (!dialog) {
        return null;
    }

    const title = dialog?.querySelector('.header-bg-color span.text-title-lg')?.textContent?.trim();

    if (title) {
        return title;
    }

    return null;
}

function getPageViewEventName(path: string): string | null {
    return PAGE_VIEW_EVENTS_MAP[path] || null;
}

function isElementTag(event: Event, tagName: string): boolean {
    return (
        (event.event_properties as { [key: string]: string })?.['[Amplitude] Element Tag'] ===
        tagName
    );
}

/**
 * Map clicked element paths to custom event names
 */
function getClickedElementEventName(event: Event): string | null {
    const clickedElementText = (event.event_properties as { [key: string]: string })?.[
        '[Amplitude] Element Text'
    ];
    const clickedElementUrl = (event.event_properties as { [key: string]: string })?.[
        '[Amplitude] Element Href'
    ];

    const isClickedLink = isElementTag(event, 'a');
    if (isClickedLink && (clickedElementText || clickedElementUrl)) {
        return `${clickedElementText || clickedElementUrl} Link Clicked`;
    }

    const isClickedButton = isElementTag(event, 'button');
    if (isClickedButton && clickedElementText) {
        return `${clickedElementText} Button Clicked`;
    }

    return null;
}

export function contextEnrichmentPlugin(): EnrichmentPlugin {
    return {
        name: 'context-enrichment',
        type: 'enrichment',

        setup: async (_config: BrowserConfig) => {
            // Plugin setup - can be used for initialization if needed
            return Promise.resolve();
        },

        execute: async (event: Event): Promise<Event> => {
            // Don't modify events if we're not in a browser context
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                return event;
            }

            // Create a copy of event properties to avoid mutations
            const enrichedProperties = { ...event.event_properties } as Event & {
                page_url: string;
                dialog_title?: string;
            };

            // Handling for autocapture page view events
            if (event.event_type === '[Amplitude] Page Viewed') {
                const path = window.location.pathname;
                const pageEventName = getPageViewEventName(path);
                if (pageEventName) {
                    event.event_type = pageEventName;
                }
            }

            if (event.event_type === '[Amplitude] Element Clicked') {
                const elementClickedEventName = getClickedElementEventName(event);
                if (elementClickedEventName) {
                    event.event_type = elementClickedEventName;
                }
            }

            enrichedProperties.page_url = window.location.href;

            const dialogTitle = extractDialogTitle();

            if (dialogTitle) {
                enrichedProperties.dialog_title = dialogTitle;
            }

            // Return enriched event
            return {
                ...event,
                event_properties: enrichedProperties,
            };
        },
    };
}
