// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { ListItem } from '@iota/apps-ui-kit';

export type MenuListItem = React.ComponentProps<typeof ListItem> & {
    isHidden?: boolean;
};
