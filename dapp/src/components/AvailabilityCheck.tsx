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
        <div className="flex flex-col items-center w-160 h-120">
            <div className="flex items-center justify-evenly w-full">
                <div className="flex w-90 h-20">
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
                </div>
                <div className="pb-7">
                    <Button
                        size={ButtonSize.Medium}
                        text="Search"
                        disabled={!isEnabled}
                        onClick={checkNameAvailability}
                    />
                </div>
            </div>
            <div className="w-120 h-40 rounded-lg p-2 text-display-lg">
                {isAvailable !== null ? (
                    isAvailable ? (
                        <div className="text-green-200">Available</div>
                    ) : (
                        <span className="text-red-200">Unavailable</span>
                    )
                ) : null}
            </div>
        </div>
    );
}
