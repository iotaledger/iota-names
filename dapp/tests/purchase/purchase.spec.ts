// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { expect } from '@playwright/test';

import { test } from '../helpers/fixtures';

test('Purchase flow works', async ({ appPage }) => {
    await expect(appPage).toHaveTitle(/IOTA Names/);
    await expect(appPage.getByText('Your On-Chain Name')).toBeVisible();
});
