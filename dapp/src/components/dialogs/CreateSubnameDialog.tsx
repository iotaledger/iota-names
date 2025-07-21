// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Info } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonType,
    Checkbox,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import {
    isSubname,
    NameRecord,
    normalizeIotaName,
    validateIotaName,
    validateIotaSubname,
} from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useState } from 'react';

import { NameRecordData, queryKey, useNameRecord, useRegistrationNfts } from '@/hooks';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import { RegistrationNft } from '@/lib/interfaces';
import { getNameObject, isNameRecordExpired } from '@/lib/utils/names';

function createSubnameUpdates({
    name,
    nameRecord,
    ownedSubnames,
    newSubname,
    allowChildCreation,
    allowTimeExtension,
}: {
    name: string;
    nameRecord?: NameRecord;
    ownedSubnames?: RegistrationNft[];
    newSubname: string;
    allowChildCreation: boolean;
    allowTimeExtension: boolean;
}) {
    const isNameSubname = isSubname(nameRecord?.name || '');

    // Only join names if there user has written anything
    const fullSubnameName = newSubname ? newSubname + '.' + name : null;

    // See if there is an existing subname with the same name
    const isSubnameAvailable = fullSubnameName
        ? getNameObject(ownedSubnames ?? [], fullSubnameName) === null
        : false;

    const nftId = isNameSubname
        ? getNameObject(ownedSubnames ?? [], name) // We only need to search in the owned subnames if its a subname
        : nameRecord?.nftId;

    const isValidSubname =
        newSubname && fullSubnameName
            ? validateIotaSubname(newSubname) || validateIotaName(fullSubnameName)
            : null;

    if (fullSubnameName && newSubname && (isValidSubname || !nftId || !isSubnameAvailable)) {
        return {
            updates: [],
            fullSubnameName: fullSubnameName,
            isSubnameAvailable: isSubnameAvailable,
            subnameError: isValidSubname ? isValidSubname : null,
        };
    }
    const updates: NameUpdate[] = [];

    if (nftId && fullSubnameName && isSubnameAvailable) {
        updates.push({
            type: 'new-subname',
            subname: fullSubnameName,
            parentNftId: nftId,
            expirationTimeParent: nameRecord?.expirationTimestampMs || 0,
            allowChildCreation,
            allowTimeExtension,
        });
    }

    return {
        updates,
        fullSubnameName,
        isSubnameAvailable,
        subnameError: fullSubnameName ? isValidSubname : null,
    };
}

type CreateSubnameProps = {
    name: string;
    setOpen: (bool: boolean) => void;
};

export function CreateSubnameDialog({ name, setOpen }: CreateSubnameProps) {
    const queryClient = useQueryClient();
    const iotaClient = useIotaClient();
    const account = useCurrentAccount();
    const { data: ownedSubnames } = useRegistrationNfts('subname');
    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord?.nameRecord) : false;

    // Editable values
    const [editSubname, setEditSubname] = useState('');
    const [editIsAllowingRenew, setEditIsAllowingRenew] = useState<boolean>(false);
    const [editIsAllowSubnames, setEditIsAllowSubnames] = useState<boolean>(false);

    const { updates, fullSubnameName, isSubnameAvailable, subnameError } = createSubnameUpdates({
        name,
        nameRecord: nameRecord?.nameRecord,
        newSubname: editSubname,
        ownedSubnames,
        allowTimeExtension: editIsAllowingRenew,
        allowChildCreation: editIsAllowSubnames,
    });
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
                transaction: updateNameTransaction.transaction,
            });

            await iotaClient.waitForTransaction({
                digest: transaction.digest,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKey.ownedObjects(account?.address || ''),
            });
            closeDialog();
        },
    });

    function closeDialog() {
        setOpen(false);
    }
    const handleCancelAddSubname = () => {
        setEditSubname('');
        closeDialog();
    };

    const handleAllowRenewChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        setEditIsAllowingRenew(checked);
    };

    const handleAllowSubnameChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        setEditIsAllowSubnames(checked);
    };

    const isLoading = isSaving || isLoadingUpdateNameTransaction || isSendingTransaction;

    const disableEdit = isNameRecordLoading || isSendingTransaction || isExpired;
    const disableSave = updates.length === 0 || isLoading || isExpired || !editSubname;

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent containerId="overlay-portal-container" position={DialogPosition.Right}>
                <Header title="New Subname" onClose={closeDialog} />
                <DialogBody>
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col h-full items-center gap-y-lg">
                            <InfoBox
                                type={InfoBoxType.Default}
                                style={InfoBoxStyle.Elevated}
                                icon={<Info />}
                                supportingText={`Create as many Subnames as you want under ${normalizeIotaName(name)}, each with its own profile page and features`}
                            />
                            <Input
                                type={InputType.Text}
                                value={editSubname}
                                onChange={(e) => setEditSubname(e.target.value)}
                                placeholder="Enter subname"
                                label="Subname name"
                                errorMessage={
                                    !isSubnameAvailable && fullSubnameName
                                        ? 'Subname is not available'
                                        : updateNameError
                                          ? updateNameError.message
                                          : subnameError
                                            ? subnameError
                                            : undefined
                                }
                            />
                            <div className="flex flex-col gap-y-md w-full">
                                <span className="text-label-lg text-names-neutral-92">
                                    Permissions
                                </span>
                                <Checkbox
                                    isChecked={editIsAllowSubnames}
                                    isDisabled={disableEdit}
                                    onCheckedChange={handleAllowSubnameChange}
                                    label="Allow Subname to create additional Subnames"
                                />

                                <Checkbox
                                    isChecked={editIsAllowingRenew}
                                    isDisabled={disableEdit}
                                    onCheckedChange={handleAllowRenewChange}
                                    label="Allow Subname to renew expiration"
                                />
                            </div>
                        </div>
                        <div className="flex w-full flex-row gap-x-xs mt-xs">
                            <Button
                                type={ButtonType.Secondary}
                                text="Cancel"
                                onClick={handleCancelAddSubname}
                                fullWidth
                            />
                            <Button
                                icon={isLoading ? <LoadingIndicator /> : null}
                                text="Create"
                                disabled={disableSave}
                                onClick={() => save()}
                                fullWidth
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
