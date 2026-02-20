// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export const AMP_COOKIES_KEY = 'AMP_COOKIES_ACCEPTED';

export const ADDRESS_REGEX = /0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}/g;

/** Pattern matching rules for dynamic button text with replacement values */
export const ALLOWED_BUTTON_TEXT_PATTERNS: Array<{ pattern: RegExp; replaceTo: string }> = [
    { pattern: /0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}/g, replaceTo: '<address>' },
    { pattern: /^\d+ Subnames?$/, replaceTo: '<count> Subname' },
    { pattern: /^Delete in \d+s$/, replaceTo: 'Delete in <countdown>s' },
];

export const ALLOWED_BUTTON_TEXTS = [
    // Wallet connection
    'Connect',
    'Disconnect',
    // Primary actions
    'Buy',
    'Bid',
    'Start auction',
    'Claim',
    // Secondary actions
    'Cancel',
    'Save',
    'Apply',
    'Create',
    'Delete',
    'Finish',
    'Renew',
    // Special purpose
    'Use Current Address',
    'Switch to Mainnet',
    'Restore Default',
    'New Subname',
    'Name',
    'Min',
    'Apply Coupon',
    // Context menu options
    'Connect to Address',
    'Personalize Avatar',
    'Set Permissions',
    'Create Subname',
    'Renew Name',
    'Renew Subname',
    'Edit Metadata',
    'View All Info',
    // Legacy/deprecated (keeping for backwards compatibility)
    'Submit',
    'Confirm',
    'View NFT',
    'All',
    'In Auction',
    'Names',
    'Subnames',
    'Add subname',
];
