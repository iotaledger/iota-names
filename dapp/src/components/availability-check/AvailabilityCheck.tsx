// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Close } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonType,
    ButtonUnstyled,
    Chip,
    ChipType,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import { validateIotaName } from '@iota/iota-names-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuctionBidDialog } from '@/auctions/components/dialogs/AuctionBidDialog';
import { useGetAuctionMetadata } from '@/auctions/hooks/useGetAuctionMetadata';
import { isAuctionActive } from '@/auctions/lib/utils';
import { NameRecordData, useNameRecord, usePriceList } from '@/hooks';
import { useNamesPurchaseMode } from '@/hooks/useNamesPurchaseMode';
import { getUserFriendlyErrorMessage } from '@/lib/utils';
import { denormalizeName } from '@/lib/utils/format/formatNames';
import { formatNanosToIota } from '@/lib/utils/format/formatNanosToIota';

import { PurchaseNameDialog } from '../dialogs/PurchaseNameDialog';
import { RenewNameDialog } from '../dialogs/RenewNameDialog';
import { NamePurchaseCard } from '../NamePurchaseCard';

interface AvailabilityCheckProps {
    autoFocusInput?: boolean;
    onCompleted?: () => void;
}
interface RecentSearch {
    searchedName: string;
    isNotAvailable: boolean;
}

const RECENT_SEARCHES_STORAGE_KEY = 'iota-names-recent-searches';
const DEBOUNCE_DELAY = 500;

export function AvailabilityCheck({ autoFocusInput, onCompleted }: AvailabilityCheckProps) {
    const [searchValue, setSearchValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
        const storedRecentSearches = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
        return storedRecentSearches ? (JSON.parse(storedRecentSearches) as RecentSearch[]) : [];
    });
    const isOnEnterSearchRef = useRef<boolean>(false);

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
    const { data: { isPaymentAuthorized, isAuctionAuthorized } = {} } = useNamesPurchaseMode();

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

    const errorMessage = auctionError?.message || nameError?.message || priceError?.message;
    const isLoading = isLoadingAuctionMetadat || isLoadingNameRecord || isLoadingPriceLst;

    const isAuctionInProgress = auctionMetadata ? isAuctionActive(auctionMetadata) : false;
    const isUnavailable = nameRecordData?.type === 'unavailable';
    const isNameTaken = isUnavailable && !isAuctionInProgress;

    useEffect(() => {
        if (!searchValue || validationError) {
            return;
        }

        const timer = window.setTimeout(() => {
            setName((current) => {
                const newName = `${searchValue}.iota`;
                return current === newName ? current : newName;
            });
        }, DEBOUNCE_DELAY);

        return () => window.clearTimeout(timer);
    }, [searchValue, validationError]);

    useEffect(() => {
        if (
            isOnEnterSearchRef.current &&
            nameRecordData &&
            searchValue &&
            name === `${searchValue}.iota`
        ) {
            updateRecentSearch(searchValue, isNameTaken);
            isOnEnterSearchRef.current = false;
        }
    }, [nameRecordData, isNameTaken, name, searchValue]);

    function persistRecentSearches(recentSearches: RecentSearch[]) {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(recentSearches));
    }

    function updateRecentSearch(searchedName: string, isNotAvailable: boolean) {
        const MAX_RECENT = 4;

        setRecentSearches((previousSearches) => {
            const updatedRecentSearches = [
                { searchedName, isNotAvailable },
                ...previousSearches.filter((search) => search.searchedName !== searchedName),
            ].slice(0, MAX_RECENT);
            persistRecentSearches(updatedRecentSearches);
            return updatedRecentSearches;
        });
    }

    function removeRecentSearch(searchedNameToRemove: string) {
        setRecentSearches((previousSearches) => {
            const updatedRecentSearches = previousSearches.filter(
                (search) => search.searchedName !== searchedNameToRemove,
            );
            persistRecentSearches(updatedRecentSearches);
            return updatedRecentSearches;
        });
    }

    function handleRecentClick(value: string) {
        setSearchValue(value);
        setName(`${value}.iota`);
        updateRecentSearch(value, isNameTaken);
    }

    const handleSearch = useCallback(() => {
        const fullName = `${searchValue}.iota`;
        if (fullName === name && nameRecordData) {
            updateRecentSearch(searchValue, isNameTaken);
        } else {
            isOnEnterSearchRef.current = true;
            setName(fullName);
        }
    }, [searchValue, validationError, isNameTaken, name, nameRecordData]);

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
        </div>
    );

    return (
        <div className="flex flex-col items-center w-full space-y-4">
            <div className="flex flex-col gap-2xl w-full max-w-[744px]">
                <div className="flex flex-col gap-y-md">
                    <div className="flex gap-x-sm items-baseline justify-center w-full">
                        <Input
                            type={InputType.Text}
                            placeholder="Check name availability"
                            value={searchValue}
                            onChange={({ target: { value } }) => handleInputChange(value)}
                            errorMessage={
                                errorMessage
                                    ? getUserFriendlyErrorMessage(errorMessage)
                                    : validationError || ''
                            }
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            leadingIcon={
                                <p className="text-primary-20 dark:text-primary-80 text-label-lg">
                                    @
                                </p>
                            }
                            autoFocus={autoFocusInput}
                            trailingElement={inputTrailingElement}
                        />
                    </div>
                    {recentSearches?.length > 0 && (
                        <div className="flex flex-row gap-x-sm items-center">
                            <span className="text-body-lg text-names-neutral-50">Recent</span>
                            <div className="flex flex-wrap gap-xs">
                                {recentSearches.map(({ searchedName, isNotAvailable }) => (
                                    <Chip
                                        key={searchedName}
                                        label={searchedName}
                                        type={isNotAvailable ? ChipType.Error : ChipType.Elevated}
                                        trailingElement={
                                            <div
                                                className="[&_svg]:h-4 [&_svg]:w-4 state-layer relative rounded-full cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeRecentSearch(searchedName);
                                                }}
                                            >
                                                <Close />
                                            </div>
                                        }
                                        onClick={() => handleRecentClick(searchedName)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center space-y-4 w-full">
                    {isLoading ? (
                        <LoadingIndicator />
                    ) : isNameTaken && name ? (
                        <NamePurchaseCard
                            name={name}
                            isAvailable={false}
                            statusMessage="Name is already taken."
                        ></NamePurchaseCard>
                    ) : (
                        nameRecordData && (
                            <>
                                {isPaymentAuthorized && (
                                    <PurchaseName
                                        name={name}
                                        nameRecordData={nameRecordData}
                                        onCompleted={handleBidOrPurchase}
                                    />
                                )}

                                {isAuctionAuthorized && (
                                    <BidName
                                        name={name}
                                        nameRecordData={nameRecordData}
                                        onCompleted={handleBidOrPurchase}
                                    />
                                )}
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

    return (
        <>
            <NamePurchaseCard
                name={name}
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
    const [isRenewDialogOpen, setRenewDialgOpen] = useState(false);

    const isAvailable = nameRecordData?.type === 'available';
    const isUnavailable = nameRecordData?.type === 'unavailable';

    function handlePurchase() {
        setPurchaseDialogOpen(false);
        setRenewDialgOpen(true);
    }

    function handleRenew() {
        setRenewDialgOpen(false);
        onCompleted();
    }

    const purchasePrice = nameRecordData?.type === 'available' ? nameRecordData.price : undefined;
    const formattedPurchasePrice = purchasePrice
        ? formatNanosToIota(purchasePrice, {
              showIotaSymbol: false,
          })
        : undefined;

    return (
        <>
            <NamePurchaseCard
                name={name}
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
            {isRenewDialogOpen && (
                <RenewNameDialog name={name} setOpen={setRenewDialgOpen} onRenew={handleRenew} />
            )}
        </>
    );
}
