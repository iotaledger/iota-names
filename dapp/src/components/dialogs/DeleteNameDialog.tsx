// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Info } from '@iota/apps-ui-icons';
import {
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';

import { useDeleteNameTransaction } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

type DeleteNameDialogProps = {
    nft: RegistrationNft;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function DeleteNameDialog({ nft, open, setOpen }: DeleteNameDialogProps) {
    const account = useCurrentAccount();

    const {
        mutateAsync: deleteName,
        isPending: isDeleteInProgress,
        error: deleteNameError,
    } = useDeleteNameTransaction({
        nft: nft,
        address: account?.address || '',
    });

    const isLoading = isDeleteInProgress;
    const isExpired = nft.isExpired;
    const disableDeleteButton = isDeleteInProgress || !isExpired;

    async function handleDeleteName() {
        try {
            await deleteName();
            console.log('Name deleted successfully!');
            setOpen(false);
        } catch (err) {
            console.error('Error deleting name:', err);
        }
    }

    function handleClose() {
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title={`Delete ${nft.name}`} onClose={handleClose} titleCentered />
                <DialogBody>
                    <div className="flex flex-col gap-y-md">
                        {isExpired && !isLoading ? (
                            <InfoBox
                                title="Name is expired"
                                supportingText="This name is expired and can be deleted."
                                icon={<Info />}
                                type={InfoBoxType.Warning}
                                style={InfoBoxStyle.Elevated}
                            />
                        ) : null}

                        <div className="flex flex-col gap-y-xs items-center">
                            <p className="text-body-md">
                                Are you sure you want to delete this name?
                            </p>
                            <p>This action cannot be undone</p>
                        </div>
                        <Button
                            icon={isLoading ? <LoadingIndicator /> : null}
                            text="Delete Name"
                            disabled={disableDeleteButton}
                            onClick={handleDeleteName}
                        />
                        {deleteNameError ? (
                            <p className="text-error-30 dark:text-error-70 text-center">
                                {deleteNameError.message}
                            </p>
                        ) : null}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
