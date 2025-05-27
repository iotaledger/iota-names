// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonSize, ButtonType, Input, InputType } from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import { isValidIotaName } from '@iota/iota-names-sdk';
import { useState } from 'react';

import { useNameRecord } from '@/hooks/useNameRecord';

export function AvailabilityCheck() {
    const { isConnected } = useCurrentWallet();
    const [searchValue, setSearchValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [isEnabled, setIsEnabled] = useState<boolean>(false);

    const { data, error } = useNameRecord(name);

    console.log(data, error);

    const handleOnSearchChange = (value: string) => {
        if (name.length > 0) {
            setName('');
        }
        setSearchValue(value);
        setIsEnabled(isValidIotaName(value));
    };

    const handleOnSearch = async () => {
        setName(searchValue);
    };

    const handlePurchase = () => {
        console.log('Purchase initiated for:', searchValue);
    };

    return (
        <div className="flex flex-col items-center w-full space-y-4">
            <div className="flex items-baseline justify-center space-x-4 w-full max-w-xl">
                <Input
                    type={InputType.Text}
                    placeholder="Check name availability"
                    value={searchValue ?? ''}
                    onChange={({ target: { value } }) => handleOnSearchChange(value)}
                    errorMessage={error?.message}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && isEnabled) {
                            handleOnSearch();
                        }
                    }}
                />
                <Button
                    size={ButtonSize.Medium}
                    text="Search"
                    disabled={!isEnabled}
                    onClick={handleOnSearch}
                />
            </div>

            {data !== null && (
                <div className="text-headline-sm">
                    {data?.type == 'available' ? (
                        <span className="text-green-700 dark:text-green-200">Available</span>
                    ) : (
                        <span className="text-red-700 dark:text-red-200">Unavailable</span>
                    )}
                </div>
            )}

            {data?.type == 'available' && (
                <div className="flex items-center space-x-4">
                    <div className="text-body-md">Price: {data?.price}</div>
                    {isConnected ? (
                        <Button type={ButtonType.Secondary} text="Buy" onClick={handlePurchase} />
                    ) : (
                        <ConnectButton connectText="Connect" />
                    )}
                </div>
            )}
        </div>
    );
}
