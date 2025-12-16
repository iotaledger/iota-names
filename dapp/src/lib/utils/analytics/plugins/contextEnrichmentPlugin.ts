// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { BrowserConfig, EnrichmentPlugin, Event } from '@amplitude/analytics-types';

const PAGE_VIEW_EVENTS_MAP: Record<string, string> = {
    '/': 'Landing Page Viewed',
    '/my-names': 'My Names Page Viewed',
    '/auctions': 'Auctions Page Viewed',
    '/search': 'Search Page Viewed',
};

/**
 * Custom Amplitude plugin that enriches autocapture events with additional context.
 *
 * This plugin adds the following properties to ALL events (including autocapture):
 * - page_path: Current route/page (e.g., "/my-names", "/auctions")
 * - page_url: Full URL
 * - page_title: Page title from <title> tag
 * - referrer: Document referrer (where user came from)
 *
 * For autocapture element click events specifically, it also adds:
 * - clicked_from_page: Same as page_path (more explicit naming)
 * - element_parent_id: ID of the parent container (useful for tracking sections)
 * - element_aria_label: ARIA label if present (accessibility context)
 */

interface ContextEnrichmentOptions {
    /**
     * Whether to include detailed page information
     * @default true
     */
    includePageContext?: boolean;

    /**
     * Whether to include referrer information
     * @default true
     */
    includeReferrer?: boolean;

    /**
     * Whether to add element parent information for click events
     * @default true
     */
    includeElementParent?: boolean;

    /**
     * Custom page name resolver function
     * Use this to map routes to friendly names (e.g., "/my-names" -> "My Names Page")
     */
    pageNameResolver?: (path: string) => string;
}

const DEFAULT_OPTIONS: Required<ContextEnrichmentOptions> = {
    includePageContext: true,
    includeReferrer: true,
    includeElementParent: true,
    pageNameResolver: (path: string) => path,
};

/**
 * Extracts dialog title from various sources in priority order:
 * 1. aria-label attribute
 * 2. aria-labelledby referenced element
 * 3. IOTA Names dialog header (div.header-bg-color span.text-title-lg)
 * 4. First heading (h1, h2, h3, [role="heading"])
 * 5. Element with data-testid containing "title"
 * 6. Common dialog title patterns (.dialog-title, .modal-title, etc.)
 * 7. First paragraph or text content
 */
function extractDialogTitle(dialog: Element): string | null {
    // Priority 1: aria-label
    const ariaLabel = dialog.getAttribute('aria-label');
    if (ariaLabel?.trim()) {
        return ariaLabel.trim();
    }

    // Priority 2: aria-labelledby
    const ariaLabelledBy = dialog.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
        const labelElement = document.getElementById(ariaLabelledBy);
        if (labelElement?.textContent?.trim()) {
            return labelElement.textContent.trim();
        }
    }

    // Priority 3: IOTA Names specific dialog header pattern
    // Handles both direct and nested span structures
    const iotaNamesTitle =
        dialog.querySelector('div.header-bg-color span.text-title-lg') ||
        dialog.querySelector('.header-bg-color .text-title-lg') ||
        dialog.querySelector('span.text-title-lg');
    if (iotaNamesTitle?.textContent?.trim()) {
        return iotaNamesTitle.textContent.trim();
    }

    // Priority 4: First heading
    const heading = dialog.querySelector('h1, h2, h3, h4, [role="heading"]');
    if (heading?.textContent?.trim()) {
        return heading.textContent.trim();
    }

    // Priority 5: Element with data-testid containing "title"
    const titleElement = dialog.querySelector('[data-testid*="title"]');
    if (titleElement?.textContent?.trim()) {
        return titleElement.textContent.trim();
    }

    // Priority 6: Common dialog title patterns
    const commonTitlePatterns = [
        '.dialog-title',
        '.modal-title',
        '[class*="DialogTitle"]',
        '[class*="ModalTitle"]',
        'header h1',
        'header h2',
        'header h3',
    ];

    for (const pattern of commonTitlePatterns) {
        const titleEl = dialog.querySelector(pattern);
        if (titleEl?.textContent?.trim()) {
            return titleEl.textContent.trim();
        }
    }

    // Priority 7: First non-empty text content (limit to first 100 chars)
    const textContent = dialog.textContent?.trim();
    if (textContent && textContent.length > 0) {
        // Get first line or first 100 characters, whichever is shorter
        const firstLine = textContent.split('\n')[0].trim();
        return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
    }

    return null;
}

/**
 * Extracts comprehensive context from a DOM element and its ancestors.
 * This function automatically discovers:
 * - Dialog/modal context
 * - Parent container information
 * - Element identifiers (data-testid, data-amp-track-*, etc.)
 * - ARIA attributes
 * - Section/context from parent elements
 */
function extractElementContext(element: Element): Record<string, string | boolean> {
    const context: Record<string, string | boolean> = {};

    // 1. Extract all data-* attributes from the element itself
    Array.from(element.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) {
            const key = attr.name.replace('data-', '').replace(/-/g, '_');
            context[key] = attr.value;
        }
    });

    // 2. Get element identifiers
    const elementId = element.id;
    if (elementId) {
        context.element_id = elementId;
    }

    // Get ARIA label for accessibility context
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
        context.element_aria_label = ariaLabel;
    }

    // Get ARIA described by
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
        context.element_aria_described_by = ariaDescribedBy;
    }

    // 3. Detect dialog/modal context
    // Check for various dialog patterns:
    // - role="dialog" (WAI-ARIA)
    // - role="alertdialog" (WAI-ARIA alert dialogs)
    // - <dialog> element (HTML5)
    // - aria-modal="true" (modal behavior)
    // - [data-dialog] (custom attribute)
    // - Common UI library patterns
    // - IOTA Names specific patterns
    let dialog = element.closest(
        [
            '[role="dialog"]',
            '[role="alertdialog"]',
            'dialog',
            '[aria-modal="true"]',
            '[data-dialog]',
            '[data-state="open"]', // Radix UI - any open state
            '[data-radix-dialog-content]', // Radix UI dialog content
            '[data-overlay]', // Common overlay pattern
            '.dialog-content-bg', // IOTA Names specific class
            '.dialog', // Common class pattern
            '.modal', // Common modal class
        ].join(', '),
    );

    console.log('d', dialog);

    // Fallback: If no dialog found, check for IOTA Names dialog pattern
    // Look for element with both header-bg-color and dialog-body-color as siblings
    if (!dialog) {
        let currentElement = element.parentElement;
        while (currentElement && currentElement !== document.body) {
            // Check if this element contains both dialog header and body
            const hasHeader = currentElement.querySelector('.header-bg-color');
            const hasBody = currentElement.querySelector('.dialog-body-color');
            if (hasHeader && hasBody) {
                dialog = currentElement;
                break;
            }
            currentElement = currentElement.parentElement;
        }
    }

    // Another fallback: Check for fixed/absolute positioned overlay with high z-index
    if (!dialog) {
        let currentElement = element.parentElement;
        while (currentElement && currentElement !== document.body) {
            const styles = window.getComputedStyle(currentElement);
            const isOverlay =
                (styles.position === 'fixed' || styles.position === 'absolute') &&
                parseInt(styles.zIndex) > 100 &&
                (currentElement.classList.contains('dialog-content-bg') ||
                    currentElement.querySelector('.header-bg-color, .dialog-title, .modal-title'));
            if (isOverlay) {
                dialog = currentElement;
                break;
            }
            currentElement = currentElement.parentElement;
        }
    }

    if (dialog) {
        context.element_in_dialog = true;

        // Get dialog identifier
        const dialogId = dialog.id;
        if (dialogId) {
            context.dialog_id = dialogId;
        }

        // Get dialog role/type
        const dialogRole = dialog.getAttribute('role');
        if (dialogRole && (dialogRole === 'dialog' || dialogRole === 'alertdialog')) {
            context.dialog_role = dialogRole;
        }

        // Get dialog title from various sources (priority order)
        const dialogTitle = extractDialogTitle(dialog);
        if (dialogTitle) {
            context.dialog_title = dialogTitle;
        }

        // Get dialog type from data attributes
        const dialogType = dialog.getAttribute('data-dialog') || dialog.getAttribute('data-testid');
        if (dialogType) {
            context.dialog_type = dialogType;
        }

        // Check if it's a modal (blocks interaction with rest of page)
        const isModal =
            dialog.getAttribute('aria-modal') === 'true' ||
            dialog.hasAttribute('data-modal') ||
            dialogRole === 'dialog' ||
            dialogRole === 'alertdialog';
        if (isModal) {
            context.dialog_is_modal = true;
        }
    }

    // 4. Get parent section/container context
    const section = element.closest('section, [role="region"], main, aside');
    if (section) {
        const sectionId = section.id;
        if (sectionId) {
            context.section_id = sectionId;
        }

        const sectionLabel = section.getAttribute('aria-label');
        if (sectionLabel) {
            context.section_label = sectionLabel;
        }
    }

    // 5. Get parent container with meaningful ID
    const parentWithId = element.closest('[id]');
    if (parentWithId?.id && parentWithId !== element) {
        context.parent_container_id = parentWithId.id;
    }

    // 6. Detect if inside a form
    const form = element.closest('form');
    if (form) {
        context.element_in_form = true;
        if (form.id) {
            context.form_id = form.id;
        }
        if (form.name) {
            context.form_name = form.name;
        }
    }

    // 7. Detect card/panel context (common pattern in UI)
    const card = element.closest('[data-testid*="card"], [class*="card"], [class*="panel"]');
    if (card) {
        const cardTestId = card.getAttribute('data-testid');
        if (cardTestId) {
            context.card_type = cardTestId;
        }
    }

    // 8. Get button/link specific context
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'button' || tagName === 'a') {
        // Get button type
        const buttonType = element.getAttribute('type');
        if (buttonType) {
            context.button_type = buttonType;
        }

        // Get button role
        const role = element.getAttribute('role');
        if (role) {
            context.button_role = role;
        }

        // Check if it's a disabled button
        if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
            context.button_disabled = true;
        }
    }

    // 9. Automatically generate a meaningful action name from context
    const actionName = generateActionName(element, context);
    if (actionName) {
        context.action_name = actionName;
    }

    return context;
}

/**
 * Generates a meaningful action name from element context.
 * Priority:
 * 1. data-amp-track-action (if exists)
 * 2. data-testid (cleaned up)
 * 3. Element text + type
 * 4. ARIA label + type
 */
function generateActionName(
    element: Element,
    context: Record<string, string | boolean>,
): string | null {
    // Priority 1: Explicit tracking action
    if (context.amp_track_action) {
        return context.amp_track_action as string;
    }

    // Priority 2: Test ID (clean it up)
    if (context.testid) {
        const testId = context.testid as string;
        // Remove common suffixes and clean up
        return testId
            .replace(/-button$/, '')
            .replace(/-link$/, '')
            .replace(/-btn$/, '');
    }

    // Priority 3: Element text + element type
    const text = element.textContent?.trim();
    const tagName = element.tagName.toLowerCase();

    if (text && text.length < 50) {
        // Clean and format the text
        const cleanText = text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);

        if (tagName === 'button') {
            return `${cleanText}_button_click`;
        } else if (tagName === 'a') {
            return `${cleanText}_link_click`;
        }
    }

    // Priority 4: ARIA label
    if (context.element_aria_label) {
        const ariaLabel = context.element_aria_label as string;
        const cleanLabel = ariaLabel
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);
        return `${cleanLabel}_click`;
    }

    return null;
}

/**
 * Default page name resolver that converts routes to friendly names
 */
function defaultPageNameResolver(path: string): string {
    const routes: Record<string, string> = {
        '/': 'Home',
        '/my-names': 'My Names',
        '/auctions': 'Auctions',
        '/search': 'Search',
    };

    // Check for exact match
    if (routes[path]) {
        return routes[path];
    }

    // Check for dynamic routes (e.g., /names/myname.iota)
    if (path.startsWith('/names/')) {
        return 'Name Details';
    }

    if (path.startsWith('/auctions/')) {
        return 'Auction Details';
    }

    // Return path as-is for unknown routes
    return path;
}

/**
 * Maps page paths to custom page view event names
 */
function getPageViewEventName(path: string): string | null {
    // Check for exact match
    if (PAGE_VIEW_EVENTS_MAP[path]) {
        return PAGE_VIEW_EVENTS_MAP[path];
    }

    // Return null for unknown routes (keep default event name)
    return null;
}

/**
 * Map clicked element paths to custom event names
 */
function defineClickedElementEventName(event: Event): string | null {
    // Example mapping - can be extended as needed
    const CLICKED_ELEMENT_EVENTS: {
        eventProperties: Record<string, string>;
        outputName: string;
    }[] = [
        {
            eventProperties: {
                '[Amplitude] Element Tag': 'a',
                '[Amplitude] Element Text': 'Documentation',
            },
            outputName: 'Documentation Page Viewed',
        },
        {
            eventProperties: {
                '[Amplitude] Element Tag': 'a',
                '[Amplitude] Element Text': 'Terms & Conditions',
            },
            outputName: 'Terms & Conditions Link Clicked',
        },
    ];

    for (const mapping of CLICKED_ELEMENT_EVENTS) {
        const match = Object.entries(mapping.eventProperties).every(
            ([key, value]) =>
                (event.event_properties as { [key: string]: string })?.[key] === value,
        );

        if (match) {
            return mapping.outputName;
        }
    }

    return null;
}

export function contextEnrichmentPlugin(options: ContextEnrichmentOptions = {}): EnrichmentPlugin {
    const config: Required<ContextEnrichmentOptions> = {
        ...DEFAULT_OPTIONS,
        ...options,
        pageNameResolver: options.pageNameResolver || defaultPageNameResolver,
    };

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
            const enrichedProperties = { ...event.event_properties };
            console.log('event.event_type', event);
            // Handling for autocapture page view events
            if (event.event_type === '[Amplitude] Page Viewed') {
                const path = window.location.pathname;
                const pageEventName = getPageViewEventName(path);
                if (pageEventName) {
                    event.event_type = pageEventName;
                }
            }

            if (event.event_type === '[Amplitude] Element Clicked') {
                const customEventName = defineClickedElementEventName(event);
                if (customEventName) {
                    event.event_type = customEventName;
                }
            }

            // Add page context for all events
            if (config.includePageContext) {
                const path = window.location.pathname;
                const pageName = config.pageNameResolver(path);

                enrichedProperties.page_path = path;
                enrichedProperties.page_url = window.location.href;
                enrichedProperties.page_title = document.title;
                enrichedProperties.page_name = pageName;

                // Add query params if present
                if (window.location.search) {
                    enrichedProperties.page_query = window.location.search;
                }

                // Add hash/fragment if present
                if (window.location.hash) {
                    enrichedProperties.page_hash = window.location.hash;
                }
            }

            // Add referrer for all events
            if (config.includeReferrer && document.referrer) {
                enrichedProperties.referrer = document.referrer;
            }

            // Special handling for autocapture element click events
            if (event.event_type === '[Amplitude] Element Clicked') {
                // Add explicit "clicked_from_page" property for easier querying
                if (config.includePageContext) {
                    enrichedProperties.clicked_from_page = window.location.pathname;
                }

                // Try to get element parent context
                if (config.includeElementParent) {
                    // Get element from event properties (if available)
                    const elementSelector = enrichedProperties['[Amplitude] Element Selector'] as
                        | string
                        | undefined;

                    if (elementSelector) {
                        try {
                            const element = document.querySelector(elementSelector);
                            if (element) {
                                // Extract comprehensive element context automatically
                                const elementContext = extractElementContext(element);
                                Object.assign(enrichedProperties, elementContext);
                            }
                        } catch (error) {
                            // Silently fail if element is no longer in DOM
                            console.debug('[ContextEnrichment] Could not find element:', error);
                        }
                    }
                }
            }

            // Return enriched event
            return {
                ...event,
                event_properties: enrichedProperties,
            };
        },
    };
}
