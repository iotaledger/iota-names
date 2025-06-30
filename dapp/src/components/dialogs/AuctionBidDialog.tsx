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
import { IOTA_DECIMALS, NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { useState } from 'react';

import { queryKey } from '@/hooks';
import { useAuctionBid } from '@/hooks/auction/useAuctionBid';
import { formatNanosToIota } from '@/lib/utils';

interface AuctionBidDialogDialogProps {
    name: string;
    isNewAuction: boolean;
    setOpen: (open: boolean) => void;
}

function toNano(iota: string) {
    try {
        return BigInt(new BigNumber(iota).shiftedBy(IOTA_DECIMALS).toNumber());
    } catch {
        return BigInt(0);
    }
}

export function AuctionBidDialog({ name, isNewAuction, setOpen }: AuctionBidDialogDialogProps) {
    const account = useCurrentAccount();
    const queryClient = useQueryClient();
    const [bidAmountValue, setBidAmountValue] = useState(
        formatNanosToIota(NANOS_PER_IOTA, {
            formatRounded: false,
            showIotaSymbol: false,
        }),
    );

    const bidNanos = toNano(bidAmountValue);
    const isBidBelowMinimum = bidNanos < NANOS_PER_IOTA;

    const minBidLabel = formatNanosToIota(NANOS_PER_IOTA, {
        formatRounded: false,
        showIotaSymbol: true,
    });

    const {
        data: auctionBidTransaction,
        isLoading: isAuctionBidLoading,
        error,
    } = useAuctionBid({
        name,
        bidNanos,
        isNewAuction,
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

    const isLoading = isAuctionBidLoading || isSendingTransaction;
    const disablePlaceBid = isLoading || isBidBelowMinimum;

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent showCloseOnOverlay>
                <Header
                    title={isNewAuction ? `Start Auction for ${name}` : `Bid for ${name}`}
                    titleCentered
                    onClose={() => setOpen(false)}
                    onBack={() => setOpen(false)}
                />

                <DialogBody>
                    <div className="flex flex-col gap-md">
                        <Input
                            type={InputType.Number}
                            label="Your bid (IOTA)"
                            min={Number(NANOS_PER_IOTA)}
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
                        text={isNewAuction ? 'Start auction' : 'Place bid'}
                        onClick={handleConfirm}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
