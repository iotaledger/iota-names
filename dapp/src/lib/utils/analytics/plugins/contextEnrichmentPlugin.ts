// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { BrowserConfig, EnrichmentPlugin, Event } from '@amplitude/analytics-types';

const PAGE_VIEW_EVENTS_MAP: Record<string, string> = {
    '/': 'Landing Page Viewed',
    '/my-names': 'My Names Page Viewed',
    '/auctions': 'Auctions Page Viewed',
    '/search': 'Search Page Viewed',
};

type ExtendedEventProperties = Event & {
    [key: string]: string;
};

type EnrichedEventProperties = ExtendedEventProperties & {
    page_url: string;
    dialog_title?: string;
};

const ALLOWED_PROPERTIES = {
    PAGE_URL: 'page_url',
    DIALOG_TITLE: 'dialog_title',
    ELEMENT_TAG: '[Amplitude] Element Tag',
    ELEMENT_TEXT: '[Amplitude] Element Text',
    ELEMENT_HREF: '[Amplitude] Element Href',
};

const EVENT_TYPE = {
    PAGE_VIEW: '[Amplitude] Page Viewed',
    ELEMENT_CLICK: '[Amplitude] Element Clicked',
};

// Context snapshot cache for capturing UI state before it changes
interface ContextSnapshot {
    dialogTitle: string | null;
    timestamp: number;
}

class ContextSnapshotCache {
    private cache: ContextSnapshot | null = null;
    private readonly CACHE_TTL_MS = 1000; // 1 second TTL

    snapshot(dialogTitle: string | null): void {
        this.cache = {
            dialogTitle,
            timestamp: Date.now(),
        };
    }

    get(): ContextSnapshot | null {
        if (!this.cache) return null;

        // Check if cache has expired
        const age = Date.now() - this.cache.timestamp;
        if (age > this.CACHE_TTL_MS) {
            this.cache = null;
            return null;
        }

        return this.cache;
    }

    clear(): void {
        this.cache = null;
    }
}

const contextCache = new ContextSnapshotCache();

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

/**
 * Capture context snapshot during the capture phase of click events.
 * This runs BEFORE any click handlers execute, ensuring we capture
 * the UI state before it changes (e.g., before dialogs close).
 */
function captureContextOnInteraction(event: MouseEvent): void {
    // Only capture for actual clicks on elements, not just any mouse event
    if (event.type !== 'click') return;

    const dialogTitle = extractDialogTitle();
    contextCache.snapshot(dialogTitle);
}

/**
 * Setup event listeners to capture context before user interactions
 */
function setupContextCapture(): () => void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return () => {}; // No-op cleanup function
    }

    // Use capture phase (true) to run before any bubbling handlers
    document.addEventListener('click', captureContextOnInteraction, true);

    // Return cleanup function
    return () => {
        document.removeEventListener('click', captureContextOnInteraction, true);
    };
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

function filterProperties(eventProperties: EnrichedEventProperties): EnrichedEventProperties {
    const filteredProperties: EnrichedEventProperties = { ...eventProperties };

    Object.keys(filteredProperties).forEach((key) => {
        if (!Object.values(ALLOWED_PROPERTIES).includes(key as keyof typeof ALLOWED_PROPERTIES)) {
            delete filteredProperties[key];
        }
    });

    return filteredProperties;
}

/**
 * Map clicked element paths to custom event names
 */
function getClickedElementEventName(event: Event): string | null {
    const clickedElementText = (event.event_properties as ExtendedEventProperties)?.[
        ALLOWED_PROPERTIES.ELEMENT_TEXT
    ];
    const clickedElementUrl = (event.event_properties as ExtendedEventProperties)?.[
        ALLOWED_PROPERTIES.ELEMENT_HREF
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
    let cleanupContextCapture: (() => void) | null = null;

    return {
        name: 'context-enrichment',
        type: 'enrichment',

        setup: async (_config: BrowserConfig) => {
            // Setup context capture listeners during plugin initialization
            cleanupContextCapture = setupContextCapture();
            return Promise.resolve();
        },

        execute: async (event: Event): Promise<Event> => {
            // Don't modify events if we're not in a browser context
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                return event;
            }

            // Create a copy of event properties to avoid mutations
            const enrichedEventProperties = {
                ...event.event_properties,
            } as EnrichedEventProperties;

            // Handling for autocapture page view events
            if (event.event_type === EVENT_TYPE.PAGE_VIEW) {
                const path = window.location.pathname;
                const pageEventName = getPageViewEventName(path);
                if (pageEventName) {
                    event.event_type = pageEventName;
                }
            }

            if (event.event_type === EVENT_TYPE.ELEMENT_CLICK) {
                const elementClickedEventName = getClickedElementEventName(event);
                if (elementClickedEventName) {
                    event.event_type = elementClickedEventName;
                }
            }

            enrichedEventProperties.page_url = window.location.href;

            // Try to get dialog title from cache first (for events that happen during UI changes)
            const cachedContext = contextCache.get();
            let dialogTitle: string | null = null;

            if (cachedContext?.dialogTitle) {
                // Use cached context if available and recent
                dialogTitle = cachedContext.dialogTitle;
            } else {
                // Fall back to current DOM state if no cache
                dialogTitle = extractDialogTitle();
            }

            if (dialogTitle) {
                enrichedEventProperties.dialog_title = dialogTitle;
            }

            const filteredProperties = filterProperties(enrichedEventProperties);

            // Return enriched event
            return {
                ...event,
                event_properties: filteredProperties,
            };
        },

        // Cleanup when plugin is removed/destroyed
        teardown: async () => {
            if (cleanupContextCapture) {
                cleanupContextCapture();
            }
            contextCache.clear();
            return Promise.resolve();
        },
    };
}
