// Copyright (c) 2026 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { AppsBackendClient } from '@iota/apps-backend-client';

export const appsBackendClient = new AppsBackendClient(process.env.NEXT_PUBLIC_APPS_BACKEND || '');

appsBackendClient.refreshFeatures();
