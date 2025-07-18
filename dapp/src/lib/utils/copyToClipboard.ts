// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import toast from 'react-hot-toast';

export async function copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
        return true;
    } catch (err) {
        toast.error('Failed to copy to clipboard. Please try again.');
        return false;
    }
}
