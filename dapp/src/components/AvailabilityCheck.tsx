// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonSize, ButtonType, Input, InputType, Skeleton } from '@iota/apps-ui-kit';
import { useCurrentWallet } from '@iota/dapp-kit';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { useCallback, useMemo, useState } from 'react';

import { useNameRecord, usePriceList } from '@/hooks';
import { useGetAuctionMetadata } from '@/hooks/auction/useGetAuctionMetadata';
import { formatNanosToIota } from '@/lib/utils';

import { PurchaseNameDialog } from './dialogs/PurchaseNameDialog';
import { NamePurchaseCard } from './name-purchase-card/NamePurchaseCard';
import { NamePurchaseStatus } from './name-purchase-card/namePurchasedCard.enums';

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
                    <div className="flex flex-col items-center w-full">
                        <NamePurchaseCard
                            name={name}
                            status={
                                isAvailable
                                    ? isConnected
                                        ? NamePurchaseStatus.Connected
                                        : NamePurchaseStatus.Unconnected
                                    : NamePurchaseStatus.Unavailable
                            }
                            value={
                                nameRecordData?.type === 'available'
                                    ? formatNanosToIota(nameRecordData.price)
                                    : undefined
                            }
                            supportingTextValue={
                                nameRecordData?.type === 'available' ? 'Price' : undefined
                            }
                            supportingText={isAuctionInProgress ? 'In auction' : undefined}
                        >
                            <Button
                                type={ButtonType.Secondary}
                                text="Buy"
                                onClick={() => setPurchaseDialogOpen(true)}
                            />
                        </NamePurchaseCard>

                        {isAuctionInProgress &&
                            (isAuctionMetadataLoading ? (
                                <Skeleton />
                            ) : (
                                <NamePurchaseCard
                                    name={name}
                                    status={
                                        isConnected
                                            ? NamePurchaseStatus.Connected
                                            : NamePurchaseStatus.Unconnected
                                    }
                                    value={formatNanosToIota(
                                        BigInt(
                                            auctionMetadata?.value?.value?.current_bid?.balance
                                                ?.value ?? 0,
                                        ) +
                                            BigInt(1) * NANOS_PER_IOTA,
                                    )}
                                    supportingTextValue="Minimum bid"
                                    supportingText={isAuctionInProgress ? 'In auction' : undefined}
                                >
                                    <Button
                                        type={ButtonType.Primary}
                                        text="Bid"
                                        onClick={() =>
                                            console.log('Bid functionality not implemented yet')
                                        }
                                    />
                                </NamePurchaseCard>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
