// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    Input,
    InputType,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useState } from 'react';

import { useAddSubname, useSubnameRecord, type RegistrationNft } from '@/hooks';

type AddSubnameProps = {
    nft: RegistrationNft;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function AddSubnameDialog({ nft, open, setOpen }: AddSubnameProps) {
    const addSubname = useAddSubname();
    const [subdomainName, setSubdomainName] = useState('');
    const fullSubdomainName = subdomainName.trim() ? subdomainName + '.' + nft.name : '';
    const { data: isAvailable, error } = useSubnameRecord(fullSubdomainName);

    const handleCancelAddSubname = () => {
        setSubdomainName('');
        setOpen(false);
    };

    const handleConfirmAddSubname = async (): Promise<void> => {
        const fullSubdomainName = subdomainName + '.' + nft.name;
        if (!nft || !subdomainName.trim()) {
            console.error('Subdomain name required');
            return;
        }
        console.log('available: ', isAvailable);
        if (!isAvailable || error) {
            console.error('subdomain name is not available');
            return;
        }

        try {
            const result = await addSubname(fullSubdomainName, nft.id, nft.expiration_timestamp_ms);
            await signAndExecuteTransaction({
                transaction: result.transaction,
            });
            console.log('Subname added successfully');
            setSubdomainName('');
            setOpen(false);
        } catch (error) {
            console.error('Error adding subname:', error);
        }
    };

    const account = useCurrentAccount();
    const isConnected = !!account?.address;
    if (!isConnected) return null;

    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title="Add subname" titleCentered />
                <DialogBody>
                    <div className="flex flex-col items-center gap-y-md">
                        <h3 className="text-lg font-semibold mb-4">Add subdomain to {nft.name}</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Subdomain name:
                            </label>
                            <Input
                                type={InputType.Text}
                                value={subdomainName}
                                onChange={(e) => setSubdomainName(e.target.value)}
                                placeholder="Input subdomain name"
                            />
                            {subdomainName && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Preview: {fullSubdomainName}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                type={ButtonType.Secondary}
                                text="Cancel"
                                onClick={handleCancelAddSubname}
                            />
                            <Button
                                type={ButtonType.Primary}
                                text="Confirm"
                                onClick={handleConfirmAddSubname}
                                disabled={!subdomainName.trim() || subdomainName.length < 3} // constant MIN_LABEL_SIZE (?)
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
