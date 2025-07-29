// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export const GAS_BALANCE_TOO_LOW_ID = 'GasBalanceTooLow';
export const NOT_ENOUGH_BALANCE_ID = 'No valid gas coins found';
export const INSUFFICIENT_COIN_BALANCE_ID = 'InsufficientCoinBalance';

export const NO_BALANCE_GENERIC_MESSAGE = 'Make sure you have enough funds and try again.';

export const CANT_RENEW_NAME_FOR_MORE_TIME = `Can't renew this name for more time.`;

// Default fallback message for unexpected errors
export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

// Common error patterns that should be caught and made user-friendly
export const ERROR_PATTERNS = {
    // Network and connection errors
    'fetch failed': 'Connection failed. Please check your internet connection and try again.',
    'network error': 'Network error. Please try again later.',
    'signal timed out': 'Request timed out. Please try again.',
    'failed to fetch': 'Unable to connect. Please check your connection and try again.',

    // Transaction errors
    'transaction failed': 'Transaction failed. Please try again.',
    'insufficient funds': 'Insufficient funds to complete this transaction.',
    'gas limit exceeded': 'Transaction requires too much gas. Please try again.',
    'rejected from user': 'Transaction rejected by user.',

    // Permission errors
    unauthorized: "You don't have permission to perform this action.",
    'access denied': "Access denied. You don't have the required permissions.",
    forbidden: 'This action is not allowed.',
};

/**
 * Error message templates with placeholder support
 * Example: getUserFriendlyErrorMessage('NAME_TOO_LONG', { name });
 * Example: getUserFriendlyErrorMessage('BID_TOO_LOW', { amount: bidAmount });
 */
export const ERROR_MESSAGE_TEMPLATES = {
    // Validation errors
    INVALID_NAME: 'Invalid name format. Please check your input.',
    NAME_TOO_LONG: 'Name "{name}" is too long. Please choose a shorter name.',
    NAME_TOO_SHORT: 'Name "{name}" is too short. Please choose a longer name.',
    NAME_ALREADY_EXISTS: 'The name "{name}" is already taken. Please choose a different name.',
    INVALID_CHARACTERS:
        'Name contains invalid characters. Please use only letters, numbers, and hyphens.',

    // Name-specific errors
    NAME_EXPIRED: 'The name "{name}" has expired and cannot be modified.',
    NAME_NOT_FOUND: 'Name "{name}" not found. It may have been deleted or transferred.',
    SUBNAME_LIMIT_REACHED: 'Maximum number of subnames reached for "{name}".',
    FAILED_TO_COPY: 'Failed to copy to clipboard. Please try again.',
    [GAS_BALANCE_TOO_LOW_ID]: 'Not enough balance to cover transaction fees.',
    [NOT_ENOUGH_BALANCE_ID]: 'Not enough balance to create the transaction.',
    [INSUFFICIENT_COIN_BALANCE_ID]: 'Insufficient coin balance to complete this action.',
} as const;
