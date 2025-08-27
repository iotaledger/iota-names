// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Close } from '@iota/apps-ui-icons';
import { Button, ButtonType, Chip, ChipType, LoadingIndicator } from '@iota/apps-ui-kit';
import { useCurrentWallet } from '@iota/dapp-kit';
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

import { ConnectButton } from '../buttons/ConnectButton';
import { PurchaseNameDialog } from '../dialogs/PurchaseNameDialog';
import { RenewNameDialog } from '../dialogs/RenewNameDialog';
import { NamePurchaseCard } from '../NamePurchaseCard';
import { SearchStylized } from '../search-component/SearchStylized';

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
    const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
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
        refetch: refetchNameRecord,
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

    const errorMessageRaw = auctionError?.message || nameError?.message || priceError?.message;
    const errorMessage = errorMessageRaw
        ? getUserFriendlyErrorMessage(errorMessageRaw)
        : validationError || '';

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

    function handlePurchase() {
        setIsRenewDialogOpen(true);
        refetchNameRecord();
    }

    function handleRenew() {
        setIsRenewDialogOpen(false);
        handleCompletedBidOrPurchase();
    }

    function handleCompletedBidOrPurchase() {
        setSearchValue('');
        setName('');
        onCompleted?.();
    }

    return (
        <div className="flex flex-col items-center w-full space-y-4">
            <div className="flex flex-col gap-xl w-full max-w-[744px]">
                <div className="flex flex-col gap-y-md">
                    <div className="flex gap-x-sm items-baseline justify-center w-full">
                        <SearchStylized
                            placeholder="Check name availability"
                            value={searchValue}
                            onChange={({ target: { value } }) => handleInputChange(value)}
                            errorMessage={errorMessage}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            leadingIcon={
                                <p className="text-names-neutral-50 text-headline-sm sm:text-headline-md">
                                    @
                                </p>
                            }
                            autoFocus={autoFocusInput}
                            onClearInput={() => {
                                setSearchValue('');
                            }}
                        />
                    </div>
                    {recentSearches?.length > 0 && (
                        <div className="flex flex-wrap gap-xs">
                            <span className="text-body-lg text-names-neutral-50 items-center flex mr-md">
                                Recent
                            </span>
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
                        />
                    ) : (
                        nameRecordData && (
                            <>
                                <PurchaseName
                                    name={name}
                                    nameRecordData={nameRecordData}
                                    onPurchase={handlePurchase}
                                />

                                <BidName
                                    name={name}
                                    nameRecordData={nameRecordData}
                                    onCompleted={handleCompletedBidOrPurchase}
                                />
                            </>
                        )
                    )}

                    {isRenewDialogOpen && (
                        <RenewNameDialog
                            setOpen={setIsRenewDialogOpen}
                            name={name}
                            onRenew={handleRenew}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

interface BidNameProps {
    name: string;
    nameRecordData: NameRecordData;
    onCompleted: () => void;
}
function BidName({ name, nameRecordData, onCompleted }: BidNameProps) {
    const { data: { isAuctionAuthorized } = {} } = useNamesPurchaseMode();
    const { isConnected } = useCurrentWallet();
    const [isAuctionBidDialogOpen, setAuctionDialogOpen] = useState(false);
    const { data: auctionMetadata } = useGetAuctionMetadata(name);

    const isAvailable = nameRecordData?.type === 'available';
    const isUnavailable = nameRecordData?.type === 'unavailable';
    const isAuctionInProgress = auctionMetadata ? isAuctionActive(auctionMetadata) : false;
    const isAllowedToBid =
        (isAvailable && isAuctionAuthorized) || (isUnavailable && isAuctionInProgress) || false;

    if (!isAllowedToBid && !isAuctionAuthorized) {
        return null;
    }

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
                    <ConnectButton />
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

interface PurchaseNameProps {
    name: string;
    nameRecordData: NameRecordData;
    onPurchase: () => void;
}
function PurchaseName({ name, nameRecordData, onPurchase }: PurchaseNameProps) {
    const { data: { isPaymentAuthorized } = {} } = useNamesPurchaseMode();
    const { isConnected } = useCurrentWallet();
    const [isPurchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

    if (!isPaymentAuthorized) {
        return null;
    }

    const isAvailable = nameRecordData?.type === 'available';
    const isUnavailable = nameRecordData?.type === 'unavailable';

    function handlePurchase() {
        onPurchase();
        setPurchaseDialogOpen(false);
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
                statusMessage={isAvailable ? undefined : 'Name cannot be purchased.'}
            >
                {isUnavailable ? null : isConnected ? (
                    <Button
                        type={ButtonType.Secondary}
                        text="Buy"
                        onClick={() => setPurchaseDialogOpen(true)}
                    />
                ) : (
                    <ConnectButton />
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
