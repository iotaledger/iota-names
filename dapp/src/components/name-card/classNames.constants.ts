// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { NameCardDisplaySize } from './enums';

export const IMAGE_SIZE: Record<NameCardDisplaySize, string> = {
    [NameCardDisplaySize.Medium]: 'w-[220px]',
    [NameCardDisplaySize.Large]: 'w-[440px]',
};

export const NAME_TEXT_SIZE: Record<NameCardDisplaySize, string> = {
    [NameCardDisplaySize.Medium]: 'text-[20px] peer-[.subname]:text-[14px]',
    [NameCardDisplaySize.Large]: 'text-[40px] peer-[.subname]:text-[28px]',
};

export const SUBNAME_TEXT_SIZE: Record<NameCardDisplaySize, string> = {
    [NameCardDisplaySize.Medium]: 'text-[20px]',
    [NameCardDisplaySize.Large]: 'text-[40px]',
};

export const EXPIRATION_TEXT_SIZE: Record<NameCardDisplaySize, string> = {
    [NameCardDisplaySize.Medium]: 'text-[8px]',
    [NameCardDisplaySize.Large]: 'text-[16px]',
};

export const LOGO_SIZE: Record<NameCardDisplaySize, string> = {
    [NameCardDisplaySize.Medium]: 'h-[22px] w-auto',
    [NameCardDisplaySize.Large]: 'h-[46px] w-auto',
};

export const NAME_CARD_CLASSNAMES = {
    image: IMAGE_SIZE,
    name: NAME_TEXT_SIZE,
    subname: SUBNAME_TEXT_SIZE,
    expiration: EXPIRATION_TEXT_SIZE,
    logo: LOGO_SIZE,
};
