// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { NameCardSize } from './enums';

export const DISPLAY_SIZE: Record<NameCardSize, string> = {
    [NameCardSize.Medium]: 'w-[220px]',
    [NameCardSize.Large]: 'w-[440px]',
};

export const NAME_TEXT_SIZE: Record<NameCardSize, string> = {
    [NameCardSize.Medium]: 'text-[20px] peer-[.subname]:text-[14px]',
    [NameCardSize.Large]: 'text-[40px] peer-[.subname]:text-[28px]',
};

export const SUBNAME_TEXT_SIZE: Record<NameCardSize, string> = {
    [NameCardSize.Medium]: 'text-[20px]',
    [NameCardSize.Large]: 'text-[40px]',
};

export const EXPIRATION_TEXT_SIZE: Record<NameCardSize, string> = {
    [NameCardSize.Medium]: 'text-[8px]',
    [NameCardSize.Large]: 'text-[16px]',
};

export const LOGO_SIZE: Record<NameCardSize, string> = {
    [NameCardSize.Medium]: 'h-[22px] w-auto',
    [NameCardSize.Large]: 'h-[46px] w-auto',
};

export const NAME_CARD_CLASSNAMES = {
    display: DISPLAY_SIZE,
    name: NAME_TEXT_SIZE,
    subname: SUBNAME_TEXT_SIZE,
    expiration: EXPIRATION_TEXT_SIZE,
    logo: LOGO_SIZE,
};

export const INDICATOR_CLASSES =
    'state-layer relative cursor-pointer p-xxs rounded-lg leading-4 flex flex-row gap-x-xxxs text-names-neutral-70 text-label-md w-max';
