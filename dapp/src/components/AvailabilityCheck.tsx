// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonSize, ButtonType, Input, InputType } from '@iota/apps-ui-kit';
import { ConnectButton, useCurrentWallet } from '@iota/dapp-kit';
import { isValidIotaName } from '@iota/iota-names-sdk';
import { useMemo, useState } from 'react';

import { useNameRecord } from '@/hooks/useNameRecord';

import { PurchaseNameDialog } from './dialogs/PurchaseNameDialog';

export function AvailabilityCheck() {
    const { isConnected } = useCurrentWallet();
    const [searchValue, setSearchValue] = useState<string>('');
    const [name, setName] = useState<string>('');

    const { data, error } = useNameRecord(name);

    const isValid = useMemo(() => isValidIotaName(searchValue), [searchValue]);
    const [isPurchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

    const handleOnSearchChange = (value: string) => {
        if (name.length > 0) {
            setName('');
        }
        setSearchValue(value);
    };

    const handleOnSearch = async () => {
        setName(searchValue);
    };

    const enableSearch = isValid;

    function onClosePurchaseDialog() {
        setPurchaseDialogOpen(false);
        setSearchValue('');
        setName('');
    }

    return (
        <div className="flex flex-col items-center w-full space-y-4">
            {isPurchaseDialogOpen && searchValue && (
                <PurchaseNameDialog
                    name={searchValue}
                    open={isPurchaseDialogOpen}
                    setOpen={setPurchaseDialogOpen}
                    onPurchase={() => onClosePurchaseDialog()}
                />
            )}
            <div className="flex items-baseline justify-center space-x-4 w-full max-w-xl">
                <Input
                    type={InputType.Text}
                    placeholder="Check name availability"
                    value={searchValue ?? ''}
                    onChange={({ target: { value } }) => handleOnSearchChange(value)}
                    errorMessage={error?.message}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && enableSearch) {
                            handleOnSearch();
                        }
                    }}
                />
                <Button
                    size={ButtonSize.Medium}
                    text="Search"
                    disabled={!enableSearch}
                    onClick={handleOnSearch}
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

            {data?.type == 'available' && (
                <div className="flex items-center space-x-4">
                    <div className="text-body-md">Price: {data?.price}</div>
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
