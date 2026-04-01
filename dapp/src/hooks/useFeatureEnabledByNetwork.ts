// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useFeatureValue } from '@iota/apps-backend-client';
import type { Network } from '@iota/iota-sdk/client';

import { Feature } from '../lib/enums';

type NetworkBasedFeature = {
    [id in Network]: boolean;
};

export function useFeatureEnabledByNetwork(feature: Feature, network: Network): boolean {
    const featureValue = useFeatureValue<NetworkBasedFeature>(feature, {} as NetworkBasedFeature);
    return featureValue[network] ?? false;
}
