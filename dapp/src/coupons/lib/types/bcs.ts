// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';

export const DummyFieldBcs = bcs.struct('DummyFieldObj', {
    dummy_field: bcs.bool(),
});
