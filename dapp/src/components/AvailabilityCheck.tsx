// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonSize, ButtonType, Input, InputType, Skeleton } from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import { useCallback, useMemo, useState } from 'react';

import { useNameRecord, usePriceList } from '@/hooks';
import { useGetAuctionMetadata } from '@/hooks/auction/useGetAuctionMetadata';
import { formatNanosToIota } from '@/lib/utils';

import { PurchaseNameDialog } from './dialogs/PurchaseNameDialog';

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

const ONE_IOTA_NANOS = 1_000_000_000;

export function AvailabilityCheck() {
    const { isConnected } = useCurrentWallet();
    const [searchValue, setSearchValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [isPurchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

    const { data: nameRecordData, error } = useNameRecord(name);
    const { data: priceList } = usePriceList();

    const { data: auctionMetadata, isLoading: isAuctionMetadataLoading } =
        useGetAuctionMetadata(name);

    const isAvailable = nameRecordData?.type === 'available';
    const isAuctionInProgress =
        nameRecordData?.type === 'unavailable' &&
        auctionMetadata?.value &&
        new Date(Number(auctionMetadata.value.value.end_timestamp_ms)).getTime() > Date.now();

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

    const statusLabel = useMemo(() => {
        if (isAvailable) {
            return <span className="text-green-700 dark:text-green-200">Available</span>;
        } else if (nameRecordData?.type === 'not-priced') {
            return <span className="text-red-700 dark:text-red-200">Not priced</span>;
        } else if (nameRecordData?.type === 'unavailable') {
            if (isAuctionMetadataLoading) {
                return <Skeleton widthClass="w-32" heightClass="h-6" />;
            }

            const isInProgress =
                auctionMetadata?.value &&
                new Date(Number(auctionMetadata.value.value.end_timestamp_ms)).getTime() >
                    Date.now();

            if (isInProgress) {
                return <span className="text-orange-600 dark:text-orange-300">In auction</span>;
            } else {
                return <span className="text-red-700 dark:text-red-200">Unavailable</span>;
            }
        } else {
            return null;
        }
    }, [nameRecordData, auctionMetadata, isAuctionMetadataLoading]);

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

            <div className="flex items-baseline justify-center space-x-4 w-full max-w-xl">
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

            {nameRecordData && <div className="text-headline-sm">{statusLabel}</div>}

            {(isAvailable || isAuctionInProgress) && (
                <div className="flex flex-col items-center space-y-4">
                    {isAvailable && (
                        <div className="flex items-center space-x-4">
                            <div className="text-body-md">
                                Price: {formatNanosToIota(nameRecordData!.price)}
                            </div>
                            {isConnected ? (
                                <Button
                                    type={ButtonType.Secondary}
                                    text="Buy"
                                    onClick={() => setPurchaseDialogOpen(true)}
                                />
                            ) : (
                                <ConnectButton connectText="Connect" />
                            )}
                        </div>
                    )}

                    {isAuctionInProgress &&
                        (isAuctionMetadataLoading ? (
                            <Skeleton />
                        ) : (
                            <div className="flex items-center space-x-4">
                                <div className="text-body-md">
                                    Minimum bid:{' '}
                                    {formatNanosToIota(
                                        Number(
                                            auctionMetadata.value.value.current_bid.balance.value,
                                        ) + ONE_IOTA_NANOS,
                                    )}
                                </div>
                                {isConnected ? (
                                    <Button
                                        type={ButtonType.Secondary}
                                        text="Bid"
                                        onClick={() =>
                                            console.log('Bid functionality not implemented yet')
                                        }
                                    />
                                ) : (
                                    <ConnectButton connectText="Connect" />
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
