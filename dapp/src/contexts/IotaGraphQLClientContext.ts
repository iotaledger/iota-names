// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { createContext } from 'react';

export type IotaGraphQLClientContextType = {
    iotaGraphQLClient: IotaGraphQLClient;
};

export const GraphQLClientContext = createContext<IotaGraphQLClientContextType | null>(null);
