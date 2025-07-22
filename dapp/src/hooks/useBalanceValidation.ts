// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';

import { getGasSummary } from '@/lib/utils/getGasSummary';

import { useBalance } from './useBalance';

export function useBalanceValidation(
    builtTx: Uint8Array<ArrayBufferLike> | null,
    price: number | null,
) {
    const client = useIotaClient();
    const account = useCurrentAccount();
    const { data: coinBalance, error: coinBalanceError } = useBalance(account?.address ?? '');
    return useQuery({
        queryKey: [builtTx, price, client, coinBalance, coinBalanceError, account?.address],
        queryFn: async () => {
            if (!builtTx || !price) {
                return {
                    totalGas: 0,
                    totalPrice: 0,
                    hasBalance: false,
                    gasSummary: '',
                    coinBalanceError: undefined,
                };
            }
            const txDryRun = await client.dryRunTransactionBlock({
                transactionBlock: builtTx,
            });
            const totalGas = Number(getGasSummary(txDryRun)?.totalGas);
            const totalPrice = Number(price) + totalGas;
            const totalBalance = Number(coinBalance?.totalBalance);
            const hasBalance = totalBalance > totalPrice;
            return {
                totalGas,
                totalPrice,
                hasBalance,
                coinBalanceError,
            };
        },
        enabled: !!price && price > 0,
        gcTime: 0,
        select: ({ totalGas, totalPrice, hasBalance, coinBalanceError }) => {
            return {
                totalGas,
                totalPrice,
                hasBalance,
                coinBalanceError,
            };
        },
    });
}
