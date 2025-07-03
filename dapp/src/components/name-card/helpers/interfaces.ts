// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { NameCardSize } from './enums';

export interface CommonNameCardProps {
    name: string;
    subname?: string;
    expiration?: number;
    image?: string;
    size?: NameCardSize;
    badge?: React.ReactNode;
}
