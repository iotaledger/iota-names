// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { ListItem } from '@iota/apps-ui-kit';

import type { NftDisplayVariants } from '@/components/name-card/variants';

import type { RegistrationNft } from '../interfaces/registration.interfaces';

export type MenuListItem = React.ComponentProps<typeof ListItem> & {
    isHidden?: boolean;
};

export type NftDisplayProps = {
    registrationNft: RegistrationNft;
    size?: NftDisplayVariants['size'];
    badge?: React.ReactNode;
};
