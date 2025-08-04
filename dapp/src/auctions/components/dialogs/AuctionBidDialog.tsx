// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Warning } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonPill,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    DisplayStats,
    Header,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    Input,
    InputType,
    LoadingIndicator,
    Panel,
    TooltipPosition,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IOTA_DECIMALS } from '@iota/iota-sdk/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuctionBid } from '@/auctions/hooks/useAuctionBid';
import { useCountdown } from '@/auctions/hooks/useCountdown';
import { useGetAuctionMetadata } from '@/auctions/hooks/useGetAuctionMetadata';
import { formatTimeRemaining, getTimeRemaining, getUserAuctionStatus } from '@/auctions/lib/utils';
import { NameRecordData, queryKey, useBalanceValidation, useNameRecord } from '@/hooks';
import {
    GAS_BALANCE_TOO_LOW_ID,
    INSUFFICIENT_COIN_BALANCE_ID,
    NOT_ENOUGH_BALANCE_ID,
} from '@/lib/constants';
import { formatNanosToIota, getUserFriendlyErrorMessage } from '@/lib/utils';
import { toNanos } from '@/lib/utils/amount';
import { formatExpirationDate } from '@/lib/utils/format/formatExpirationDate';

interface AuctionBidDialogDialogProps {
    name: string;
    closeDialog: () => void;
    onCompleted?: () => void;
}

export function AuctionBidDialog({ name, closeDialog, onCompleted }: AuctionBidDialogDialogProps) {
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();
    const queryClient = useQueryClient();
    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);

    const nameRecord = nameRecordData as Extract<NameRecordData, { type: 'available' }> | undefined;
    const { data: auctionMetadata } = useGetAuctionMetadata(name);
    const minBidNanos =
        auctionMetadata?.minBidNanos || (nameRecord ? BigInt(nameRecord.price) : null);

    const [bidAmountValue, setBidAmountValue] = useState<string | undefined>();

    // Sync the minimum bid amount
    useEffect(() => {
        if (minBidNanos) {
            setBidAmountValue(
                formatNanosToIota(minBidNanos, {
                    formatRounded: false,
                    showIotaSymbol: false,
                }),
            );
        }
    }, [minBidNanos]);

    const bidNanos = bidAmountValue ? toNanos(bidAmountValue) : null;

    const {
        data: auctionBidTransaction,
        isLoading: isAuctionBidLoading,
        isPending: isAuctionBidPending,
        error: auctionError,
    } = useAuctionBid({
        name,
        bidNanos: bidNanos ?? BigInt(0),
    });

    const { data: balanceValidation, error: balanceValidationError } = useBalanceValidation(
        auctionBidTransaction?.builtTx ?? null,
        Number(bidNanos),
    );

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
            toast.success(
                `Successfully placed bid of ${formatNanosToIota(bidNanos ?? 0, {
                    formatRounded: false,
                    showIotaSymbol: true,
                })} on ${normalizeIotaName(name)}`,
            );
            closeDialog();
            onCompleted?.();
        },
        onError(err) {
            toast.error(getUserFriendlyErrorMessage(err));
        },
    });

    const hasEnoughGas =
        !balanceValidationError?.message.includes(NOT_ENOUGH_BALANCE_ID) &&
        !balanceValidationError?.message.includes(GAS_BALANCE_TOO_LOW_ID) &&
        !balanceValidationError?.message.includes(INSUFFICIENT_COIN_BALANCE_ID);

    const status = auctionMetadata && getUserAuctionStatus(auctionMetadata, account?.address || '');
    const timeRemainingMs = auctionMetadata && getTimeRemaining(auctionMetadata);
    const { milliseconds } = useCountdown(timeRemainingMs || 0);

    const isBidAboveDecimals = bidNanos === null;
    const isBidBelowMinimum = minBidNanos ? (bidNanos || BigInt(0)) < minBidNanos : false;

    const isLoading =
        isNameRecordLoading || isAuctionBidLoading || isSendingTransaction || isSigningTransaction;
    const isPending = isAuctionBidPending;
    const disablePlaceBid =
        isPending ||
        isLoading ||
        isBidBelowMinimum ||
        !balanceValidation?.hasBalance ||
        !hasEnoughGas;

    const formattedTimeRemaining = formatTimeRemaining(milliseconds);
    const currentBid = auctionMetadata
        ? formatNanosToIota(auctionMetadata.currentBidNanos, {
              formatRounded: false,
              showIotaSymbol: true,
          })
        : '--';
    const expirationDate = auctionMetadata
        ? formatExpirationDate(auctionMetadata.nftExpiration)
        : '--';
    const minBidLabel = minBidNanos
        ? formatNanosToIota(minBidNanos, {
              formatRounded: false,
              showIotaSymbol: true,
          })
        : '--';
    const minBidWithoutLabel = minBidNanos
        ? formatNanosToIota(minBidNanos, {
              formatRounded: false,
              showIotaSymbol: false,
          })
        : '--';
    const errorMessage = (() => {
        if (isBidAboveDecimals) {
            return `The value exceeds the maximum decimals (${IOTA_DECIMALS}).`;
        } else if (isBidBelowMinimum) {
            return `Bid must be ≥ ${minBidLabel}`;
        } else if (!hasEnoughGas) {
            return getUserFriendlyErrorMessage(NOT_ENOUGH_BALANCE_ID);
        } else if (auctionError) {
            return getUserFriendlyErrorMessage(auctionError);
        } else if (balanceValidationError) {
            return getUserFriendlyErrorMessage(balanceValidationError);
        }
    })();

    return (
        <Dialog open onOpenChange={closeDialog}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header
                    title="Auction"
                    titleCentered
                    onClose={() => closeDialog()}
                    onBack={() => closeDialog()}
                />

                <DialogBody>
                    <div className="flex flex-col justify-between h-full items-center">
                        <div className="flex flex-col w-full gap-y-md">
                            {status === 'top_bidder' && (
                                <InfoBox
                                    title="Top Bidder"
                                    supportingText="Your are the top bidder already"
                                    icon={<Warning />}
                                    type={InfoBoxType.Warning}
                                    style={InfoBoxStyle.Default}
                                />
                            )}

                            <Panel bgColor="bg-names-neutral-12">
                                <div className="px-md py-lg">
                                    <span className="text-names-neutral-100 text-headline-sm break-words overflow-hidden">
                                        {normalizeIotaName(name)}
                                    </span>
                                </div>
                            </Panel>
                            {auctionMetadata && (
                                <div className="flex flex-row gap-x-sm w-full">
                                    <DisplayStats
                                        label="Current Bid"
                                        value={currentBid}
                                        tooltipText="The current highest bid for this auction."
                                        tooltipPosition={TooltipPosition.Right}
                                    />
                                    <DisplayStats
                                        label="Time Left"
                                        value={formattedTimeRemaining}
                                    />
                                </div>
                            )}
                            <Input
                                type={InputType.NumericFormat}
                                label="Your Bid"
                                min={Number(minBidNanos)}
                                value={bidAmountValue}
                                onChange={({ target: { value } }) => setBidAmountValue(value)}
                                errorMessage={errorMessage}
                                trailingElement={
                                    <ButtonPill
                                        onClick={() => setBidAmountValue(minBidWithoutLabel)}
                                    >
                                        Min
                                    </ButtonPill>
                                }
                            />
                        </div>
                        <div className="flex w-full flex-col gap-y-md">
                            {auctionMetadata && (
                                <DisplayStats label="Registration Expires" value={expirationDate} />
                            )}
                            <div className="flex w-full flex-row gap-x-xs mt-xs">
                                <Button
                                    type={ButtonType.Secondary}
                                    text="Cancel"
                                    onClick={() => closeDialog()}
                                    fullWidth
                                />
                                <Button
                                    type={ButtonType.Primary}
                                    disabled={disablePlaceBid}
                                    icon={isLoading ? <LoadingIndicator /> : null}
                                    text={auctionMetadata ? 'Bid' : 'Start auction'}
                                    onClick={() => {
                                        if (auctionBidTransaction) {
                                            handleConfirm(auctionBidTransaction.transaction);
                                        }
                                    }}
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
