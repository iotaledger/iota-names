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
 * Get user-friendly error message from error key with optional arguments
 * @param key - The error message template key
 * @param args - Optional arguments for message interpolation
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(key: ErrorMessageKey, args?: ErrorMessageArgs): string;
/**
 * Get user-friendly error message from error string or Error object (legacy support)
 * @param error - Error string or Error object
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: string | Error): string;
/**
 * Get user-friendly error message with support for keys or legacy error objects
 */
export function getUserFriendlyErrorMessage(
    keyOrError: ErrorMessageKey | string | Error,
    args?: ErrorMessageArgs,
): string {
    // Check if it's a template key
    if (typeof keyOrError === 'string' && keyOrError in ERROR_MESSAGE_TEMPLATES) {
        const template = ERROR_MESSAGE_TEMPLATES[keyOrError as ErrorMessageKey];
        return interpolateMessage(template, args);
    }

    // Legacy support for error objects and error strings
    const errorMessage =
        typeof keyOrError === 'string'
            ? keyOrError.toLowerCase()
            : keyOrError.message.toLowerCase();

    // Check for specific error patterns
    for (const [pattern, message] of Object.entries(ERROR_PATTERNS)) {
        if (errorMessage.includes(pattern.toLowerCase())) {
            return message;
        }
    }

    // Return default message for unrecognized errors
    return DEFAULT_ERROR_MESSAGE;
}
