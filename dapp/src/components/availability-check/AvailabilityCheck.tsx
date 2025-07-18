// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Close, Search } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonType,
    ButtonUnstyled,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import { validateIotaName } from '@iota/iota-names-sdk';
import { useCallback, useMemo, useState } from 'react';

import { AuctionBidDialog } from '@/auctions/components/dialogs/AuctionBidDialog';
import { useGetAuctionMetadata } from '@/auctions/hooks/useGetAuctionMetadata';
import { isAuctionActive } from '@/auctions/lib/utils';
import { NameRecordData, useNameRecord, usePriceList } from '@/hooks';
import { denormalizeName, normalizeName } from '@/lib/utils/format/formatNames';
import { formatNanosToIota } from '@/lib/utils/format/formatNanosToIota';

import { PurchaseNameDialog } from '../dialogs/PurchaseNameDialog';
import { NamePurchaseCard } from '../NamePurchaseCard';

interface AvailabilityCheckProps {
    autoFocusInput?: boolean;
    onCompleted?: () => void;
}

export function AvailabilityCheck({ autoFocusInput, onCompleted }: AvailabilityCheckProps) {
    const [searchValue, setSearchValue] = useState<string>('');
    const [name, setName] = useState<string>('');

    const {
        data: auctionMetadata,
        error: auctionError,
        isLoading: isLoadingAuctionMetadat,
    } = useGetAuctionMetadata(name);
    const {
        data: nameRecordData,
        error: nameError,
        isLoading: isLoadingNameRecord,
    } = useNameRecord(name);
    const { data: priceList, error: priceError, isLoading: isLoadingPriceLst } = usePriceList();

    const validationError = useMemo(
        () =>
            searchValue
                ? validateIotaName(
                      `${searchValue}.iota`,
                      priceList?.minLength,
                      priceList?.maxLength,
                      false,
                  )
                : null,
        [searchValue, priceList],
    );

    const handleSearch = useCallback(() => {
        if (searchValue) setName(`${searchValue}.iota`);
    }, [searchValue]);

    function handleInputChange(inputValue: string) {
        setSearchValue(denormalizeName(inputValue));
        if (name) {
            setName('');
        }
    }

    function handleBidOrPurchase() {
        setSearchValue('');
        setName('');
        onCompleted?.();
    }

    const errorMessage =
        auctionError?.message || nameError?.message || priceError?.message || validationError || '';
    const isLoading = isLoadingAuctionMetadat || isLoadingNameRecord || isLoadingPriceLst;

    const normalizedName = normalizeName(name);
    const enableSearch = Boolean(searchValue) && !errorMessage;
    const isAuctionInProgress = auctionMetadata ? isAuctionActive(auctionMetadata) : false;
    const isUnavailable = nameRecordData?.type === 'unavailable';
    const isNameTaken = isUnavailable && !isAuctionInProgress;

    const inputTrailingElement = (
        <div className="flex flex-row gap-xs">
            {searchValue.length > 0 && (
                <ButtonUnstyled
                    className="input-icon-color [&_svg]:h-5 [&_svg]:w-5 p-sm state-layer relative rounded-full"
                    onClick={() => handleInputChange('')}
                >
                    <Close />
                </ButtonUnstyled>
            )}
            <ButtonUnstyled
                className="p-sm rounded-full [&_svg]:h-5 [&_svg]:w-5 bg-names-neutral-100 disabled:opacity-40"
                disabled={!enableSearch}
                onClick={handleSearch}
            >
                <Search className="text-black" />
            </ButtonUnstyled>
        </div>
    );

    return (
        <div className="flex flex-col items-center w-full space-y-4">
            <div className="flex flex-col gap-2xl w-full max-w-[744px]">
                <div className="flex gap-x-sm items-baseline justify-center w-full">
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
                        autoFocus={autoFocusInput}
                        trailingElement={inputTrailingElement}
                    />
                </div>
                <div className="flex flex-col items-center space-y-4 w-full">
                    {isLoading ? (
                        <LoadingIndicator />
                    ) : isNameTaken ? (
                        <NamePurchaseCard
                            name={normalizedName}
                            isAvailable={false}
                            statusMessage="Name is already taken."
                        ></NamePurchaseCard>
                    ) : (
                        nameRecordData && (
                            <>
                                <PurchaseName
                                    name={name}
                                    nameRecordData={nameRecordData}
                                    onCompleted={handleBidOrPurchase}
                                />

                                <BidName
                                    name={name}
                                    nameRecordData={nameRecordData}
                                    onCompleted={handleBidOrPurchase}
                                />
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function BidName({
    name,
    nameRecordData,
    onCompleted,
}: {
    name: string;
    nameRecordData: NameRecordData;
    onCompleted: () => void;
}) {
    const { isConnected } = useCurrentWallet();
    const [isAuctionBidDialogOpen, setAuctionDialogOpen] = useState(false);
    const { data: auctionMetadata } = useGetAuctionMetadata(name);

    const isAvailable = nameRecordData?.type === 'available';
    const isUnavailable = nameRecordData?.type === 'unavailable';
    const isAuctionInProgress = auctionMetadata ? isAuctionActive(auctionMetadata) : false;
    const isAllowedToBid = isAvailable || (isUnavailable && isAuctionInProgress) || false;

    function handleBid() {
        setAuctionDialogOpen(false);
        onCompleted();
    }

    const purchasePrice = nameRecordData?.type === 'available' ? nameRecordData.price : undefined;
    // If there is no auction yet, then we use the purchase price as minimum
    const bidPrice = auctionMetadata?.minBidNanos || purchasePrice;
    const formattedBidPrice = bidPrice
        ? formatNanosToIota(bidPrice, { showIotaSymbol: false })
        : undefined;
    const normalizedName = normalizeName(name);

    return (
        <>
            <NamePurchaseCard
                name={normalizedName}
                isAvailable={isAllowedToBid}
                price={formattedBidPrice}
                priceSupportingText="Minimum bid"
                statusMessage={isAuctionInProgress ? 'In auction' : ''}
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

            {isAuctionBidDialogOpen && (
                <AuctionBidDialog
                    name={name}
                    closeDialog={() => setAuctionDialogOpen(false)}
                    onCompleted={handleBid}
                />
            )}
        </>
    );
}

function PurchaseName({
    name,
    nameRecordData,
    onCompleted,
}: {
    name: string;
    nameRecordData: NameRecordData;
    onCompleted: () => void;
}) {
    const { isConnected } = useCurrentWallet();
    const [isPurchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

    const isAvailable = nameRecordData?.type === 'available';
    const isUnavailable = nameRecordData?.type === 'unavailable';

    function handlePurchase() {
        setPurchaseDialogOpen(false);
        onCompleted();
    }

    const purchasePrice = nameRecordData?.type === 'available' ? nameRecordData.price : undefined;
    const formattedPurchasePrice = purchasePrice
        ? formatNanosToIota(purchasePrice, {
              showIotaSymbol: false,
          })
        : undefined;
    const normalizedName = normalizeName(name);

    return (
        <>
            <NamePurchaseCard
                name={normalizedName}
                isAvailable={isAvailable}
                price={formattedPurchasePrice}
                priceSupportingText={isAvailable ? 'Price' : undefined}
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

            {isPurchaseDialogOpen && (
                <PurchaseNameDialog
                    name={name}
                    open={isPurchaseDialogOpen}
                    setOpen={setPurchaseDialogOpen}
                    onPurchase={handlePurchase}
                />
            )}
        </>
    );
}
