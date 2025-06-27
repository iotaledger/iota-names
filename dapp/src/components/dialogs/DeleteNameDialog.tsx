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
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubName } from '@iota/iota-names-sdk';
import { useMutation } from '@tanstack/react-query';

import { NameUpdate, useUpdateNameTransaction } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

type DeleteNameDialogProps = {
    nft: RegistrationNft;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function DeleteNameDialog({ nft, open, setOpen }: DeleteNameDialogProps) {
    const account = useCurrentAccount();
    const iotaClient = useIotaClient();
    // queryClient.invalidateQueries({ queryKey: queryKey.ownedObjects(address) }); // onSuccess

    const isNameSubName = nft ? isSubName(nft.name) : null;
    const isExpired = nft.isExpired || false;
    // Create updates
    const updates: NameUpdate[] = [];

    if (nft && isExpired) {
        // const parentNftId = isNameSubName
        //     ? (getSubdomainObjectId(subdomainsOwned, parent) ?? '')
        //     : nft.id;

        updates.push({
            type: 'delete-name',
            nft: nft.id ?? '',
            isSubname: isNameSubName || false,
        });
    }
    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingUpdateNameTransaction,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        name: nft.name,
        updates,
        isExpired,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { mutate: save, isPending: isSaving } = useMutation({
        async mutationFn() {
            if (!updateNameTransaction) return;
            const transaction = await signAndExecuteTransaction({
                transaction: updateNameTransaction,
            });

            await iotaClient.waitForTransaction({
                digest: transaction.digest,
            });
        },
        onSuccess: () => {
            closeDialog();
        },
    });

    const isLoading = isLoadingUpdateNameTransaction || isSaving || isSendingTransaction;
    const disableDeleteButton = isLoadingUpdateNameTransaction || !isExpired;

    function closeDialog() {
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title={`Delete ${nft.name}`} onClose={closeDialog} titleCentered />
                <DialogBody>
                    <div className="flex flex-col gap-y-md">
                        {isExpired && !isLoading ? (
                            <InfoBox
                                title={`${nft.name} is expired`}
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
                            onClick={() => save()}
                        />
                        {updateNameError ? (
                            <p className="text-error-30 dark:text-error-70 text-center">
                                {updateNameError.message}
                            </p>
                        ) : null}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
