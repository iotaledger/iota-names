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
import { useMemo, useState } from 'react';

import { useAuctionBid } from '@/hooks/auction/useAuctionBid';
import { formatNanosToIota } from '@/lib/utils';

interface AuctionBidDialogDialogProps {
    name: string;
    minBidNanos: bigint;
    isNewAuction: boolean;
    setOpen: (open: boolean) => void;
}

const ONE_IOTA_NANOS = 1_000_000_000;

function parseIotaToNanos(iotas: string | number): bigint {
    const asNumber = typeof iotas === 'number' ? iotas : Number(iotas);
    return BigInt(Math.round(asNumber * ONE_IOTA_NANOS));
}

export function AuctionBidDialog({
    name,
    minBidNanos,
    isNewAuction,
    setOpen,
}: AuctionBidDialogDialogProps) {
    const [initialBidAmount, setInitialBidAmount] = useState(
        formatNanosToIota(minBidNanos, {
            formatRounded: false,
            showIotaSymbol: false,
        }),
    );

    const IotaBid = Number(initialBidAmount) || 0;
    const bidAmountInNanos = parseIotaToNanos(initialBidAmount);
    const minimumBidInIota = Number(minBidNanos) / ONE_IOTA_NANOS;
    const isBidBelowMinimum = IotaBid < minimumBidInIota;

    const minBidLabel = useMemo(
        () =>
            formatNanosToIota(minBidNanos, {
                formatRounded: false,
                showIotaSymbol: true,
            }),
        [minBidNanos],
    );

    const { mutate: createBid, isPending, error } = useAuctionBid();

    const handleConfirm = () => {
        createBid({
            name,
            bidNanos: bidAmountInNanos,
            isNewAuction,
        });
    };

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
                            min={minimumBidInIota}
                            value={initialBidAmount}
                            onChange={({ target: { value } }) => setInitialBidAmount(value)}
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
                        disabled={isPending || isBidBelowMinimum}
                        icon={isPending ? <LoadingIndicator /> : null}
                        text={isNewAuction ? 'Start auction' : 'Place bid'}
                        onClick={handleConfirm}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
