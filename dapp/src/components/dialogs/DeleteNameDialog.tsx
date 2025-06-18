// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    Card,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useMutation } from '@tanstack/react-query';

import { NameRecordData, useDeleteNameTransaction, useNameRecord } from '@/hooks';
import { isNameRecordExpired } from '@/lib/utils/names';

type DeleteNameDialogProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function DeleteNameDialog({ name, open, setOpen }: DeleteNameDialogProps) {
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();

    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);

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
        nft: name,
        isSubname: false,
        address: account?.address || '',
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSendingTransaction } =
        useSignAndExecuteTransaction();

    const { mutate: deleteName, isPending: isSaving } = useMutation({
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

    const isLoading = isSaving || isLoadingDeleteNameTransaction || isSendingTransaction;

    const disableDeleteButton = isNameRecordLoading || isSendingTransaction || !isExpired;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container">
                <Header title={`Delete ${name}`} onClose={handleClose} titleCentered />
                <DialogBody>
                    <div className="flex flex-col gap-y-md">
                        {isExpired && !isLoading ? (
                            <Card>
                                <p className="text-yellow-300">Name is expired.</p>
                            </Card>
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
