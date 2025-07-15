// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';

export const PricingConfigBcs = bcs.struct('PricingConfig', {
    dummy_field: bcs.bool(),
});

export const NameBcs = bcs.struct('Name', {
    labels: bcs.vector(bcs.string()),
});

export const CoreConfigBcs = bcs.struct('CoreConfig', {
    dummy_field: bcs.bool(),
});
