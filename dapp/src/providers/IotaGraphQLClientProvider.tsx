// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useIotaClientContext } from '@iota/dapp-kit';
import { getNetwork } from '@iota/iota-sdk/client';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { useMemo } from 'react';

import { GraphQLClientContext } from '@/contexts';

export const IotaGraphQLClientProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { network } = useIotaClientContext();
    const { graphql } = getNetwork(network || '');

    const iotaGraphQLClient = useMemo(() => {
        if (graphql) {
            return new IotaGraphQLClient({
                url: graphql,
            });
        } else {
            throw new Error('GraphQL endpoint is not defined for the provided network');
        }
    }, [graphql]);

    return (
        <GraphQLClientContext.Provider value={{ iotaGraphQLClient }}>
            {children}
        </GraphQLClientContext.Provider>
    );
};
