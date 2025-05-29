// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonSize, ButtonType, Input, InputType } from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import { isValidIotaName } from '@iota/iota-names-sdk';
import { useState } from 'react';

import { useIotaNamesClient } from '@/providers/contexts';

import { PurchaseName } from './PurchaseName';

export function AvailabilityCheck() {
    const { iotaNamesClient } = useIotaNamesClient();
    const { isConnected } = useCurrentWallet();
    const [searchValue, setSearchValue] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [price, setPrice] = useState<number | null>(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    const handleOnSearchInputChange = (value: string) => {
        setSearchValue(value ?? null);
        setIsAvailable(null);
        setPrice(null);

        const isValidSearch = isValidIotaName(value);
        setIsEnabled(isValidSearch);
        setErrorMessage(value && !isValidSearch ? 'Invalid name' : null);
    };

    const checkNameAvailability = async () => {
        if (!searchValue) return;

        try {
            const nameRecordResponse = await iotaNamesClient.getNameRecord(searchValue);
            const nameIsAvailable = nameRecordResponse === null;
            setIsAvailable(nameIsAvailable);

            if (nameIsAvailable) {
                const price = await iotaNamesClient.calculatePrice({
                    name: searchValue,
                    years: 1,
                    isRegistration: true,
                });
                setPrice(price);
            } else {
                setPrice(null);
            }

            setErrorMessage(null);
        } catch (err) {
            console.error(err);
            setErrorMessage('Error fetching name record');
            setIsAvailable(null);
            setPrice(null);
        }
    };

    return (
        <div className="flex flex-col items-center w-full space-y-4">
            {showPurchaseModal && searchValue && (
                <PurchaseName
                    name={searchValue}
                    onClose={() => {
                        setShowPurchaseModal(false);
                        setSearchValue(null);
                        setIsAvailable(null);
                        setPrice(null);
                    }}
                />
            )}
            <div className="flex items-baseline justify-center space-x-4 w-full max-w-xl">
                <Input
                    type={InputType.Text}
                    placeholder="Check name availability"
                    value={searchValue ?? ''}
                    onChange={({ target: { value } }) => handleOnSearchInputChange(value)}
                    errorMessage={errorMessage ?? undefined}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && isEnabled) {
                            checkNameAvailability();
                        }
                    }}
                />
                <Button
                    size={ButtonSize.Medium}
                    text="Search"
                    disabled={!isEnabled}
                    onClick={checkNameAvailability}
                />
            </div>

            {isAvailable !== null && (
                <div className="text-headline-sm">
                    {isAvailable ? (
                        <span className="text-green-700 dark:text-green-200">Available</span>
                    ) : (
                        <span className="text-red-700 dark:text-red-200">Unavailable</span>
                    )}
                </div>
            )}

            {isAvailable && price !== null && (
                <div className="flex items-center space-x-4">
                    <div className="text-body-md">Price: {price}</div>
                    {isConnected ? (
                        <Button
                            type={ButtonType.Secondary}
                            text="Buy"
                            onClick={() => setShowPurchaseModal(true)}
                        />
                    ) : (
                        <ConnectButton connectText="Connect" />
                    )}
                </div>
            )}
        </div>
    );
}
