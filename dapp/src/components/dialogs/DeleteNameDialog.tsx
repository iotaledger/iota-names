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
import { isSubname } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useRegistrationNfts } from '@/hooks';
import { queryKey } from '@/hooks/queryKey';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';
import { getNameObject } from '@/lib/utils/names';

type DeleteNameDialogProps = {
    nft: RegistrationNft;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function DeleteNameDialog({ nft, open, setOpen }: DeleteNameDialogProps) {
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const account = useCurrentAccount();

    const { data: subnamesOwned } = useRegistrationNfts('subname');

    const isNameSubname = nft ? isSubname(nft.name) : null;

    // Create updates
    const updates: NameUpdate[] = [];

    if (nft.isExpired) {
        const nftId = isNameSubname ? getNameObject(subnamesOwned ?? [], nft.name) : nft.id;
        if (nftId) {
            updates.push({
                type: 'delete-name',
                nft: nftId,
                isSubname: isNameSubname || false,
            });
        }
    }

    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingUpdateNameTransaction,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        updates,
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
            queryClient.invalidateQueries({
                queryKey: queryKey.ownedObjects(account?.address || ''),
            });
            toast.success(`Successfully deleted expired name @${nft.name}`);
            closeDialog();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    function closeDialog() {
        setOpen(false);
    }

    const isLoading = isLoadingUpdateNameTransaction || isSaving || isSendingTransaction;
    const disableDeleteButton = isLoadingUpdateNameTransaction || isLoading || !nft.isExpired;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" isFixedPosition>
                <Header title={`Delete ${nft.name}`} onClose={closeDialog} titleCentered />
                <DialogBody>
                    <div className="flex flex-col gap-y-md">
                        {nft.isExpired && !isLoading ? (
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
                        {updateNameError ? (
                            <p className="text-error-30 dark:text-error-70 text-center">
                                {updateNameError.message}
                            </p>
                        ) : null}
                        <Button
                            icon={isLoading ? <LoadingIndicator /> : null}
                            text="Delete Name"
                            disabled={disableDeleteButton}
                            onClick={() => save()}
                        />
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
