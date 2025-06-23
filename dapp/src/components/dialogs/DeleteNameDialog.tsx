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
import { useMutation } from '@tanstack/react-query';

import { NameRecordData, RegistrationNft, useDeleteNameTransaction, useNameRecord } from '@/hooks';
import { isNameRecordExpired } from '@/lib/utils/names';

type DeleteNameDialogProps = {
    nft: RegistrationNft;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function DeleteNameDialog({ nft, open, setOpen }: DeleteNameDialogProps) {
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();

    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(nft.name);

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord?.nameRecord) : false;

    const {
        data: deleteNameTransaction,
        isLoading: isLoadingDeleteNameTransaction,
        error: deleteNameError,
    } = useDeleteNameTransaction({
        nft: nft.objectId,
        isSubname: nft.name.includes('.'),
        address: account?.address || '',
        isExpired: isExpired,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { mutate: deleteName, isPending: isDeleteInProgress } = useMutation({
        async mutationFn() {
            if (!deleteNameTransaction) return;
            const transaction = await signAndExecuteTransaction({
                transaction: deleteNameTransaction,
            });

            await iotaClient.waitForTransaction({
                digest: transaction.digest,
            });
        },
    });

    function handleClose() {
        setOpen(false);
    }

    const isLoading = isDeleteInProgress || isSendingTransaction;

    const disableDeleteButton = isNameRecordLoading || isSendingTransaction || !isExpired;

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
                            onClick={() => deleteName()}
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
