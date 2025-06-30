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
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { queryKey } from '@/hooks';
import { useAuctionBid } from '@/hooks/auction/useAuctionBid';
import { useGetAuctionMetadata } from '@/hooks/auction/useGetAuctionMetadata';
import { formatNanosToIota } from '@/lib/utils';
import { toNanos } from '@/lib/utils/amount';

interface AuctionBidDialogDialogProps {
    name: string;
    setOpen: (open: boolean) => void;
}

export function AuctionBidDialog({ name, setOpen }: AuctionBidDialogDialogProps) {
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
        bidNanos,
    });
    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    async function handleConfirm() {
        if (!auctionBidTransaction) return;

        await signAndExecuteTransaction({
            transaction: auctionBidTransaction,
        });

        queryClient.invalidateQueries({ queryKey: queryKey.userAuctionHistory(account?.address) });
        setOpen(false);
    }

    const minBidLabel = formatNanosToIota(minBidNanos, {
        formatRounded: false,
        showIotaSymbol: true,
    });
    const isBidBelowMinimum = bidNanos < minBidNanos;

    const isLoading = isAuctionBidLoading || isSendingTransaction;
    const isPending = isAuctionBidPending;
    const disablePlaceBid = isPending || isLoading || isBidBelowMinimum;

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent showCloseOnOverlay>
                <Header
                    title={auctionMetadata ? `Start Auction for ${name}` : `Bid for ${name}`}
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
                            errorMessage={
                                isBidBelowMinimum
                                    ? `Bid must be ≥ ${minBidLabel}`
                                    : error
                                      ? error.message
                                      : undefined
                            }
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
                        text={auctionMetadata ? 'Start auction' : 'Place bid'}
                        onClick={handleConfirm}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
