// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { ButtonSize } from './button.enums';

export const PADDINGS: Record<ButtonSize, string> = {
    [ButtonSize.Small]: 'px-md py-xs',
    [ButtonSize.Medium]: 'px-md py-sm',
};

export const PADDINGS_ONLY_ICON: Record<ButtonSize, string> = {
    [ButtonSize.Small]: 'p-xs',
    [ButtonSize.Medium]: 'p-sm',
};

export const TEXT_CLASSES: Record<ButtonSize, string> = {
    [ButtonSize.Small]: 'text-label-md',
    [ButtonSize.Medium]: 'text-label-lg',
};
