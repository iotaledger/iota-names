// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import 'dotenv/config';

import { test as setup } from '@playwright/test';

import { toggleSmartContractMode } from './toggleSmartContract';

setup('Activate Purchase Smart Contract flag', async () => {
    await toggleSmartContractMode('purchases');
});
