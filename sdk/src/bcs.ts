// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';

export const PricingConfigBcs = bcs.struct('PricingConfig', {
    dummy_field: bcs.bool(),
});

export const DomainBcs = bcs.struct('Domain', {
    labels: bcs.vector(bcs.string()),
});
