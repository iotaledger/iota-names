// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useContext } from 'react';

import { GraphQLClientContext, IotaGraphQLClientContextType } from '@/contexts';

export function useIotaGraphQLClient(): IotaGraphQLClientContextType {
    const context = useContext(GraphQLClientContext);

    if (!context) {
        throw new Error('useGraphQLClientContext must be used within a IotaGraphQLClientProvider');
    }

    return context;
}
