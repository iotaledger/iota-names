// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonSize, ButtonType, Input, InputType } from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import { useCallback, useMemo, useState } from 'react';

import { useNameRecord, usePriceList } from '@/hooks';
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

export function AvailabilityCheck() {
    const { isConnected } = useCurrentWallet();
    const [searchValue, setSearchValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [isPurchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

    const { data, error } = useNameRecord(name);
    const { data: priceList } = usePriceList();

    const validationError = useMemo(
        () => getValidationError(searchValue, priceList?.minLength, priceList?.maxLength),
        [searchValue, priceList],
    );

    const handleSearch = useCallback(() => {
        if (searchValue) setName(`${searchValue}.iota`);
    }, [searchValue]);

    function handleChange(inputValue: string) {
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

    const errorMessage = error?.message ?? validationError ?? '';
    const canBuy = data?.type === 'available';
    const enableSearch = Boolean(searchValue) && !errorMessage;

    return (
        <div className="flex flex-col items-center w-full space-y-4">
            {isPurchaseDialogOpen && canBuy && (
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
                    onChange={({ target: { value } }) => handleChange(value)}
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

            {data !== null && (
                <div className="text-headline-sm">
                    {data?.type == 'available' ? (
                        <span className="text-green-700 dark:text-green-200">Available</span>
                    ) : data?.type == 'unavailable' ? (
                        <span className="text-red-700 dark:text-red-200">Unavailable</span>
                    ) : data?.type == 'not-priced' ? (
                        <span className="text-red-700 dark:text-red-200">Not priced</span>
                    ) : null}
                </div>
            )}

            {canBuy && (
                <div className="flex items-center space-x-4">
                    <div className="text-body-md">Price: {formatNanosToIota(data.price)}</div>
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
        </div>
    );
}
