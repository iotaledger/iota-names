// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    DEFAULT_ERROR_MESSAGE,
    ERROR_MESSAGE_TEMPLATES,
    ERROR_PATTERNS,
} from '@/lib/constants/errorMessages.constants';

// Type for error message template keys
export type ErrorMessageKey = keyof typeof ERROR_MESSAGE_TEMPLATES;

// Type for template arguments
export type ErrorMessageArgs = Record<string, string | number>;

/**
 * Interpolates template placeholders with provided arguments
 * @param template - The message template with placeholders like {name}, {amount}
 * @param args - Object with key-value pairs to replace placeholders
 * @returns The interpolated message
 */
function interpolateMessage(template: string, args?: ErrorMessageArgs): string {
    if (!args) return template;

    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return args[key]?.toString() || match;
    });
}

/**
 * Get user-friendly error message by key or error object
 * @param keyOrError - Error message manual key or Error object
 * @param args - Optional arguments for message interpolation
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(
    keyOrError: ErrorMessageKey | string | Error,
    args?: ErrorMessageArgs,
): string {
    if (typeof keyOrError === 'string' && keyOrError in ERROR_MESSAGE_TEMPLATES) {
        const template = ERROR_MESSAGE_TEMPLATES[keyOrError as ErrorMessageKey];
        return interpolateMessage(template, args);
    }

    const errorMessage =
        typeof keyOrError === 'string'
            ? keyOrError.toLowerCase()
            : keyOrError.message.toLowerCase();

    for (const [pattern, message] of Object.entries(ERROR_PATTERNS)) {
        if (errorMessage.includes(pattern.toLowerCase())) {
            return message;
        }
    }

    return DEFAULT_ERROR_MESSAGE;
}
