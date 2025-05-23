// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonSize, Input, InputType } from '@iota/apps-ui-kit';
import { isValidIotaName } from '@iota/iota-names-sdk';
import { useState } from 'react';

import { useIotaNamesClient } from '@/providers/contexts';

export function AvailabilityCheck() {
    const { iotaNamesClient } = useIotaNamesClient();
    const [searchValue, setSearchValue] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

    const handleOnSearchInputChange = (value: string) => {
        setSearchValue(value ?? null);
        setIsAvailable(null);

        const isValidSearch = isValidIotaName(value);
        setIsEnabled(isValidSearch);
        setErrorMessage(value && !isValidSearch ? 'Invalid name' : null);
    };

    const checkNameAvailability = async () => {
        if (searchValue) {
            try {
                const nameRecordResponse = await iotaNamesClient.getNameRecord(searchValue);
                setIsAvailable(nameRecordResponse === null);
                setErrorMessage(null);
            } catch {
                setErrorMessage('Error fetching name record');
                setIsAvailable(null);
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full space-y-4">
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
        </div>
    );
}
