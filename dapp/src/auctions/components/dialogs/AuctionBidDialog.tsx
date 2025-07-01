// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonSize,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IOTA_DECIMALS, NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuctionBid } from '@/auctions/hooks/useAuctionBid';
import { useGetAuctionMetadata } from '@/auctions/hooks/useGetAuctionMetadata';
import { queryKey } from '@/hooks';
import { formatNanosToIota } from '@/lib/utils';
import { toNanos } from '@/lib/utils/amount';

interface AuctionBidDialogDialogProps {
    name: string;
    setOpen: (open: boolean) => void;
}

export function AuctionBidDialog({ name, setOpen }: AuctionBidDialogDialogProps) {
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();
    const queryClient = useQueryClient();
    const { data: auctionMetadata } = useGetAuctionMetadata(name);
    const minBidNanos = auctionMetadata?.minBidNanos || NANOS_PER_IOTA;
    const [bidAmountValue, setBidAmountValue] = useState(
        formatNanosToIota(minBidNanos, {
            formatRounded: false,
            showIotaSymbol: false,
        }),
    );

    const bidNanos = toNanos(bidAmountValue);

    const {
        data: auctionBidTransaction,
        isLoading: isAuctionBidLoading,
        isPending: isAuctionBidPending,
        error,
    } = useAuctionBid({
        name,
        bidNanos: bidNanos ?? BigInt(0),
    });
    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { mutateAsync: handleConfirm, isPending: isSigningTransaction } = useMutation({
        async mutationFn(auctionBidTransaction: Transaction) {
            const transactionResult = await signAndExecuteTransaction({
                transaction: auctionBidTransaction,
            });

            await iotaClient.waitForTransaction({
                digest: transactionResult.digest,
            });
        },
        onSuccess() {
            queryClient.invalidateQueries({
                queryKey: queryKey.userAuctionHistory(account?.address),
            });
            queryClient.invalidateQueries({ queryKey: queryKey.auctionMetadata(name) });
            setOpen(false);
        },
    });

    const minBidLabel = formatNanosToIota(minBidNanos, {
        formatRounded: false,
        showIotaSymbol: true,
    });
    const isBidAboveDecimals = bidNanos === null;
    const isBidBelowMinimum = (bidNanos || BigInt(0)) < minBidNanos;

    const isLoading = isAuctionBidLoading || isSendingTransaction || isSigningTransaction;
    const isPending = isAuctionBidPending;
    const disablePlaceBid = isPending || isLoading || isBidBelowMinimum;

    const errorMessage = (() => {
        if (isBidAboveDecimals) {
            return `The value exceeds the maximum decimals (${IOTA_DECIMALS}).`;
        } else if (isBidBelowMinimum) {
            return `Bid must be ≥ ${minBidLabel}`;
        } else if (error) {
            return error.message;
        }
    })();

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent showCloseOnOverlay>
                <Header
                    title={auctionMetadata ? `Bid for ${name}` : `Start Auction for ${name}`}
                    titleCentered
                    onClose={() => setOpen(false)}
                    onBack={() => setOpen(false)}
                />

                <DialogBody>
                    <div className="flex flex-col gap-md">
                        <Input
                            type={InputType.Number}
                            label="Your bid (IOTA)"
                            min={Number(minBidNanos)}
                            value={bidAmountValue}
                            onChange={({ target: { value } }) => setBidAmountValue(value)}
                            errorMessage={errorMessage}
                        />

                        <div className="flex items-center justify-between">
                            <span className="text-body-md text-neutral-40 dark:text-neutral-60">
                                Minimum bid:
                            </span>
                            <span className="text-body-md">{minBidLabel}</span>
                        </div>
                    </div>
                </DialogBody>

                <div className="flex w-full justify-center gap-2 px-md--rs pb-md--rs pt-sm--rs">
                    <Button
                        size={ButtonSize.Small}
                        type={ButtonType.Outlined}
                        text="Cancel"
                        onClick={() => setOpen(false)}
                    />
                    <Button
                        size={ButtonSize.Small}
                        type={ButtonType.Primary}
                        disabled={disablePlaceBid}
                        icon={isLoading ? <LoadingIndicator /> : null}
                        text={auctionMetadata ? 'Place bid' : 'Start auction'}
                        onClick={() => {
                            if (auctionBidTransaction) {
                                handleConfirm(auctionBidTransaction);
                            }
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
