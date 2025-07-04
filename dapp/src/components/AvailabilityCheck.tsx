// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonSize, ButtonType, Input, InputType } from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { useCallback, useMemo, useState } from 'react';

import { AuctionBidDialog } from '@/auctions/components/dialogs/AuctionBidDialog';
import { useGetAuctionMetadata } from '@/auctions/hooks/useGetAuctionMetadata';
import { useNameRecord, usePriceList } from '@/hooks';
import { formatNanosToIota } from '@/lib/utils';

import { PurchaseNameDialog } from './dialogs/PurchaseNameDialog';
import { NamePurchaseCard } from './NamePurchaseCard';

function normalizeNameInput(name: string) {
    return name.toLowerCase().replace(/\.iota$/i, '');
}

function getValidationError(
    name: string,
    minLength: number = 3,
    maxLength: number = 64,
): string | null {
    const IOTA_NAME_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
    if (!name) return null;

    if (name.includes('.')) {
        return 'No subdomains allowed';
    }
    if (!IOTA_NAME_REGEX.test(name)) {
        return 'Invalid characters. Only a-z, 0-9, and hyphens (not at the beginning or end) are allowed';
    }
    if (name.length < minLength || name.length > maxLength) {
        return `Name must be ${minLength}-${maxLength} characters long`;
    }
    return null;
}

export function AvailabilityCheck() {
    const { isConnected } = useCurrentWallet();
    const [searchValue, setSearchValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [isPurchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
    const [isAuctionBidDialogOpen, setAuctionDialogOpen] = useState(false);

    const { data: nameRecordData, error } = useNameRecord(name);
    const { data: priceList } = usePriceList();

    const { data: auctionMetadata, isLoading: isAuctionMetadataLoading } =
        useGetAuctionMetadata(name);

    const isAvailable = nameRecordData?.type === 'available';
    const isUnavailable = nameRecordData?.type === 'unavailable';
    const isAuctionInProgress =
        isUnavailable &&
        auctionMetadata?.endTimestamp &&
        auctionMetadata.endTimestamp.getTime() > Date.now();

    // User can bid in existing auctions or if there is no auction and the name is not taken
    const canBid = isAuctionInProgress || isAvailable;

    const validationError = useMemo(
        () => getValidationError(searchValue, priceList?.minLength, priceList?.maxLength),
        [searchValue, priceList],
    );

    const errorMessage = error?.message ?? validationError ?? '';
    const enableSearch = Boolean(searchValue) && !errorMessage;

    const handleSearch = useCallback(() => {
        if (searchValue) setName(`${searchValue}.iota`);
    }, [searchValue]);

    function handleInputChange(inputValue: string) {
        setSearchValue(normalizeNameInput(inputValue));
        if (name) {
            setName('');
        }
    }

    function handlePurchase() {
        setPurchaseDialogOpen(false);
        setSearchValue('');
        setName('');
    }
    const statusMessage =
        isUnavailable && !isAuctionInProgress
            ? 'Name is already taken.'
            : isAuctionInProgress
              ? 'In auction'
              : undefined;

    const isAuctionLoading = name && (!nameRecordData || isAuctionMetadataLoading);
    const cleanName = normalizeNameInput(name);

    return (
        <div className="flex flex-col items-center w-full space-y-4">
            {isPurchaseDialogOpen && isAvailable && (
                <PurchaseNameDialog
                    name={name}
                    open={isPurchaseDialogOpen}
                    setOpen={setPurchaseDialogOpen}
                    onPurchase={handlePurchase}
                />
            )}
            <div className="flex flex-col gap-2xl w-full max-w-[744px]">
                <div className="flex items-baseline justify-center w-full">
                    <Input
                        type={InputType.Text}
                        placeholder="Check name availability"
                        value={searchValue}
                        onChange={({ target: { value } }) => handleInputChange(value)}
                        errorMessage={errorMessage}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        leadingIcon={
                            <p className="text-primary-20 dark:text-primary-80 text-label-lg">@</p>
                        }
                    />
                    <Button
                        size={ButtonSize.Medium}
                        text="Search"
                        disabled={!enableSearch}
                        onClick={handleSearch}
                    />
                </div>
                {nameRecordData && (
                    <div className="flex flex-col items-center space-y-4 w-full">
                        {!isAuctionInProgress && (
                            <NamePurchaseCard
                                name={cleanName}
                                isAvailable={!!(!isUnavailable || isAuctionInProgress)}
                                price={
                                    isAvailable
                                        ? formatNanosToIota(nameRecordData.price, {
                                              showIotaSymbol: false,
                                          })
                                        : undefined
                                }
                                priceSupportingText={isAvailable ? 'Price' : undefined}
                                statusMessage={statusMessage}
                            >
                                {isUnavailable ? null : isConnected ? (
                                    <Button
                                        type={ButtonType.Secondary}
                                        text="Buy"
                                        onClick={() => setPurchaseDialogOpen(true)}
                                    />
                                ) : (
                                    <ConnectButton connectText="Connect" />
                                )}
                            </NamePurchaseCard>
                        )}

                        {isAuctionLoading ? (
                            <p>Loading...</p>
                        ) : canBid ? (
                            <NamePurchaseCard
                                name={cleanName}
                                isAvailable={!!(!isUnavailable || isAuctionInProgress)}
                                price={formatNanosToIota(
                                    auctionMetadata?.minBidNanos || NANOS_PER_IOTA,
                                    { showIotaSymbol: false },
                                )}
                                priceSupportingText="Minimum bid"
                                statusMessage={statusMessage}
                            >
                                {isConnected ? (
                                    <Button
                                        type={ButtonType.Primary}
                                        text="Bid"
                                        onClick={() => setAuctionDialogOpen(true)}
                                    />
                                ) : (
                                    <ConnectButton connectText="Connect" />
                                )}
                            </NamePurchaseCard>
                        ) : null}
                    </div>
                )}

                {isAuctionBidDialogOpen && (
                    <AuctionBidDialog name={name} closeDialog={() => setAuctionDialogOpen(false)} />
                )}
            </div>
        </div>
    );
}
