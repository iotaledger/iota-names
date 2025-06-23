// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonType,
    Card,
    CardAction,
    CardActionType,
    CardBody,
    CardType,
    Checkbox,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    Input,
    InputType,
    LoadingIndicator,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubName } from '@iota/iota-names-sdk';
import { isValidIotaAddress } from '@iota/iota-sdk/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useState } from 'react';

import { useRegistrationNfts, useSubnameRecord } from '@/hooks';
import { queryKey } from '@/hooks/queryKey';
import { useGetDefaultName } from '@/hooks/useGetDefaultName';
import { NameRecordData, useNameRecord } from '@/hooks/useNameRecord';
import { NameUpdate, useUpdateNameTransaction } from '@/hooks/useUpdateNameTransaction';
import {
    getNamePermissions,
    isNameRecordExpired,
    useSubdomainPermissionsValidation,
} from '@/lib/utils/names';

import { VisualAssetsDialog } from './AvatarSelectDialog';

type UpdateNameDialogProps = {
    name: string;
    open: boolean;
    setOpen: (bool: boolean) => void;
};

export function UpdateNameDialog({ name, open, setOpen }: UpdateNameDialogProps) {
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const account = useCurrentAccount();
    const { data: nameRecordData, isLoading: isNameRecordLoading } = useNameRecord(name);
    const { data: addressName, isLoading: isAddressNameLoading } = useGetDefaultName(
        account?.address || '',
    );

    // We are sure that only owned names are passed here
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;
    const isNameSubName = nameRecord?.nameRecord ? isSubName(nameRecord.nameRecord.name) : null;
    const isExpired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord?.nameRecord) : false;
    const namePermissions = nameRecord?.nameRecord
        ? getNamePermissions(nameRecord.nameRecord)
        : null;

    const domainsOwned = useRegistrationNfts('domain');
    const subdomainsOwned = useRegistrationNfts('subdomain');

    const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState<boolean>(false);
    // Editable values
    const [editTargetAddress, setEditTargetAddress] = useState<string>('');
    const [editIsDefaultName, setEditDefaultName] = useState<boolean>(false);
    const [editIsAllowingRenew, setEditIsAllowingRenew] = useState<boolean>(false);
    const [editIsAllowSubnames, setEditIsAllowSubnames] = useState<boolean>(false);
    const [subdomainDialogOpen, setSubdomainDialogOpen] = useState(false);
    const [newSubdomainName, setNewSubdomainName] = useState('');
    const fullSubdomainName = newSubdomainName.trim()
        ? newSubdomainName + '.' + nameRecord?.nameRecord.name
        : '';
    const { data: isSubdomainAvailable, error } = useSubnameRecord(fullSubdomainName);

    const { canModifyTimeExtension, canModifyChildCreation } =
        useSubdomainPermissionsValidation(name);

    // Sync permissions
    useEffect(() => {
        if (namePermissions) {
            setEditIsAllowingRenew(namePermissions.allowTimeExtension);
            setEditIsAllowSubnames(namePermissions.allowChildCreation);
        }
    }, [namePermissions?.allowChildCreation, namePermissions?.allowTimeExtension]);
    const [avatarNftId, setAvatarNftId] = useState<string | null>(null);

    // Sync name target address
    useEffect(() => {
        if (nameRecord && editTargetAddress.length === 0) {
            setEditTargetAddress(nameRecord.nameRecord.targetAddress ?? '');
        }
    }, [nameRecord]);

    // Sync address current default name
    useEffect(() => {
        if (addressName === name) {
            setEditDefaultName(true);
        }
    }, [addressName]);

    function getSubdomainObjectId(name: string) {
        if (!isSubName(name)) {
            const parentDomain = domainsOwned.data?.find(
                (domain: { name: string | null }) => domain.name === name,
            );
            return parentDomain?.id || null;
        }
        const parentParts = name?.split('.').length;
        if (parentParts === 2) {
            const parentDomain = domainsOwned.data?.find(
                (domain: { name: string | null }) => domain.name === name,
            );
            return parentDomain?.id || null;
        } else if (parentParts && parentParts >= 3) {
            const parentSubdomain = subdomainsOwned.data?.find(
                (subdomain: { name: string | null }) => subdomain.name === name,
            );
            return parentSubdomain?.id || null;
        }
    }
    function getParentSubdomainObjectId(name: string) {
        if (!isSubName(name)) {
            const parentDomain = domainsOwned.data?.find(
                (domain: { name: string | null }) => domain.name === name,
            );
            return parentDomain?.id || null;
        }
        const parts = name.split('.');
        const directParentName = parts.slice(1).join('.');
        const parentParts = directParentName?.split('.').length;
        if (parentParts === 2) {
            const parentDomain = domainsOwned.data?.find(
                (domain: { name: string | null }) => domain.name === directParentName,
            );
            return parentDomain?.id || null;
        } else if (parentParts && parentParts >= 3) {
            const parentSubdomain = subdomainsOwned.data?.find(
                (subdomain: { name: string | null }) => subdomain.name === directParentName,
            );
            return parentSubdomain?.id || null;
        }
    }

    const isTargetCurrentAddress = editTargetAddress === account?.address;
    const isTargetUsedInName = editTargetAddress === nameRecord?.nameRecord.targetAddress;
    const isDefaultName = addressName === name;

    // Setting a different target address than the owner address and using the name as default is not possible
    const isWrongCombination = !isTargetCurrentAddress && editIsDefaultName;
    const isValidAddress = isValidIotaAddress(editTargetAddress);
    const isThereAddress = editTargetAddress.length > 0;

    // Create updates
    const updates: NameUpdate[] = [];

    if (nameRecord && isThereAddress && isValidAddress && !isTargetUsedInName) {
        // Only allow changing the target address if it is valid and it is not used yet
        const parentObjectId = getParentSubdomainObjectId(nameRecord.nameRecord.name);
        updates.push({
            type: 'set-target-address',
            address: editTargetAddress,
            isSubname: false,
            nft: parentObjectId ?? '',
        });
    }

    if (isDefaultName && !editIsDefaultName) {
        // If it is currently the default name, but it is now disabled
        updates.push({
            type: 'unset-default',
        });
    } else if (!isDefaultName && editIsDefaultName && isTargetCurrentAddress) {
        // If it is not currently the default name, but it is now enabled and the target address matches
        updates.push({
            type: 'set-default',
            name,
        });
    }

    if (
        nameRecord &&
        isNameSubName &&
        (editIsAllowSubnames != namePermissions?.allowChildCreation ||
            editIsAllowingRenew != namePermissions?.allowTimeExtension)
    ) {
        // Only allow editing the setup if it is a subname and the config has changed
        const parentObjectId = getParentSubdomainObjectId(nameRecord.nameRecord.name);
        updates.push({
            type: 'edit-setup',
            nft: parentObjectId ?? '',
            allowChildCreation: editIsAllowSubnames,
            allowTimeExtension: editIsAllowingRenew,
        });
    }
    if (
        nameRecord &&
        ((isSubdomainAvailable && fullSubdomainName) ||
            editIsAllowSubnames != namePermissions?.allowChildCreation ||
            editIsAllowingRenew != namePermissions?.allowTimeExtension)
    ) {
        const parentObjectId = getSubdomainObjectId(nameRecord.nameRecord.name);
        console.log('parentObjectId', parentObjectId);
        console.log('nameRecord?.nameRecord?.nftId', nameRecord?.nameRecord?.nftId);
        updates.push({
            type: 'new-subdomain',
            subdomainName: fullSubdomainName,
            parentNftId: parentObjectId ?? '',
            expirationTimeParent: nameRecord?.nameRecord?.expirationTimestampMs || 0,
            allowChildCreation: editIsAllowSubnames,
            allowTimeExtension: editIsAllowingRenew,
        });
    }
    if (avatarNftId && avatarNftId !== nameRecord?.nameRecord?.nftId) {
        updates.push({
            type: 'set-avatar',
            nftId: avatarNftId,
        });
    }

    const {
        data: updateNameTransaction,
        error: updateNameError,
        isLoading: isLoadingUpdateNameTransaction,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        name,
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

            for (const update of updates) {
                switch (update.type) {
                    case 'unset-default':
                    case 'set-default':
                        queryClient.invalidateQueries({
                            queryKey: queryKey.defaultName(account?.address || ''),
                        });
                        break;
                    case 'set-target-address':
                        queryClient.invalidateQueries({
                            queryKey: queryKey.nameRecord(name),
                        });
                        break;
                }
            }
        },
    });

    function handleClose() {
        setOpen(false);
    }

    function handleTargetAddressChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
        setEditTargetAddress(value);
    }

    function handleReverseLookupChange({ target: { checked } }: ChangeEvent<HTMLInputElement>) {
        setEditDefaultName(checked);
    }
    const handleAllowRenewChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        setEditIsAllowingRenew(checked);
    };

    const handleAllowSubnameChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        setEditIsAllowSubnames(checked);
    };

    function handleSetCurrentAsTargetAddress() {
        if (account?.address) {
            setEditTargetAddress(account?.address);
        }
    }
    const handleCancelAddSubname = () => {
        setNewSubdomainName('');
        setSubdomainDialogOpen(false);
    };

    const handleConfirmAddSubname = async () => {
        if (!newSubdomainName.trim()) {
            console.error('Subdomain name required');
            return;
        }
        if (!isSubdomainAvailable || error) {
            console.error('subdomain name is not available');
            return;
        }
        setSubdomainDialogOpen(false);
    };

    const isLoading =
        isSaving || isAddressNameLoading || isLoadingUpdateNameTransaction || isSendingTransaction;

    const disableEdit = isNameRecordLoading || isSendingTransaction || isExpired;
    const disableSave = updates.length === 0 || isWrongCombination || isLoading || isExpired;

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent containerId="overlay-portal-container">
                    <Header title={`Update ${name}`} onClose={handleClose} titleCentered />
                    <DialogBody>
                        {isExpired && !isLoading ? (
                            <Card>
                                <p className="text-yellow-300">Name is expired.</p>
                            </Card>
                        ) : null}
                        {isThereAddress && !isValidAddress ? (
                            <Card>
                                <p className="text-yellow-300"> Not valid IOTA address.</p>
                            </Card>
                        ) : null}
                        <Card type={CardType.Outlined}>
                            <CardBody title="Target Address" />
                            <Input
                                type={InputType.Text}
                                value={editTargetAddress}
                                disabled={disableEdit}
                                onChange={handleTargetAddressChange}
                            />
                            {!isTargetCurrentAddress && (
                                <Button
                                    onClick={handleSetCurrentAsTargetAddress}
                                    text="Use current"
                                    disabled={disableEdit}
                                />
                            )}
                        </Card>
                        <Card type={CardType.Outlined}>
                            <CardBody
                                title="Set as default name"
                                subtitle="Enables reverse lookup."
                            />
                            <Checkbox
                                isChecked={editIsDefaultName}
                                isDisabled={disableEdit}
                                onCheckedChange={handleReverseLookupChange}
                            />
                        </Card>

                        <Card type={CardType.Outlined}>
                            <CardBody title="Avatar NFT" />
                            <CardAction
                                type={CardActionType.Button}
                                title="Update Avatar NFT"
                                onClick={() => setIsAvatarSelectorOpen(true)}
                            />
                        </Card>
                        {isWrongCombination ? (
                            <Card>
                                <p className="text-yellow-300">
                                    {' '}
                                    Use your account as target address to be able to set this name
                                    as default.
                                </p>
                            </Card>
                        ) : null}
                        {(!isNameSubName || editIsAllowSubnames) && (
                            <Card type={CardType.Outlined}>
                                <CardBody
                                    title="Add new subname"
                                    subtitle="Create a new subdomain."
                                />
                                <Button
                                    text="Add subname"
                                    onClick={() => setSubdomainDialogOpen(true)}
                                    disabled={
                                        (nameRecord?.nameRecord?.expirationTimestampMs ?? 0) <
                                            Date.now() && fullSubdomainName !== ''
                                    }
                                />
                            </Card>
                        )}
                        {isNameSubName ? (
                            <>
                                <Card type={CardType.Outlined}>
                                    <CardBody
                                        title="Set allow renew name"
                                        subtitle="Allow renew name."
                                    />
                                    <Checkbox
                                        isChecked={editIsAllowingRenew}
                                        isDisabled={disableEdit || !canModifyTimeExtension}
                                        onCheckedChange={handleAllowRenewChange}
                                    />
                                </Card>
                                <Card type={CardType.Outlined}>
                                    <CardBody
                                        title="Set allow subname"
                                        subtitle="Allow creating subdomains."
                                    />
                                    <Checkbox
                                        isChecked={editIsAllowSubnames}
                                        isDisabled={disableEdit || !canModifyChildCreation}
                                        onCheckedChange={handleAllowSubnameChange}
                                    />
                                </Card>
                            </>
                        ) : null}
                        {subdomainDialogOpen && (
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogContent containerId="overlay-portal-container">
                                    <Header title="Add subname" titleCentered />
                                    <DialogBody>
                                        <div className="flex flex-col items-center gap-y-md">
                                            <h3 className="text-lg font-semibold mb-4">
                                                Add subdomain to {nameRecord?.nameRecord?.name}
                                            </h3>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">
                                                    Subdomain name:
                                                </label>
                                                <Input
                                                    type={InputType.Text}
                                                    value={newSubdomainName}
                                                    onChange={(e) =>
                                                        setNewSubdomainName(e.target.value)
                                                    }
                                                    placeholder="Input subdomain name"
                                                />
                                                <Card type={CardType.Outlined}>
                                                    <CardBody
                                                        title="Set allow renew name"
                                                        subtitle="Allow renew name."
                                                    />
                                                    <Checkbox
                                                        isChecked={editIsAllowingRenew}
                                                        isDisabled={disableEdit}
                                                        onCheckedChange={handleAllowRenewChange}
                                                    />
                                                </Card>
                                                <Card type={CardType.Outlined}>
                                                    <CardBody
                                                        title="Set allow subname"
                                                        subtitle="Allow creating subdomains."
                                                    />
                                                    <Checkbox
                                                        isChecked={editIsAllowSubnames}
                                                        isDisabled={disableEdit}
                                                        onCheckedChange={handleAllowSubnameChange}
                                                    />
                                                </Card>
                                                {newSubdomainName && (
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
                                                    disabled={
                                                        !newSubdomainName.trim() ||
                                                        newSubdomainName.length < 3
                                                    } // constant MIN_LABEL_SIZE (?)
                                                />
                                            </div>
                                        </div>
                                    </DialogBody>
                                </DialogContent>
                            </Dialog>
                        )}
                        {updateNameError ? (
                            <div className="text-red-400">{updateNameError.message}</div>
                        ) : null}
                        <Button
                            icon={isLoading ? <LoadingIndicator /> : null}
                            text="Save"
                            disabled={disableSave}
                            onClick={() => save()}
                        />
                    </DialogBody>
                </DialogContent>
            </Dialog>
            {isAvatarSelectorOpen && (
                <VisualAssetsDialog
                    setOpen={setIsAvatarSelectorOpen}
                    onAssetClick={(assetId) => {
                        setAvatarNftId(assetId);
                        setIsAvatarSelectorOpen(false);
                    }}
                />
            )}
        </>
    );
}
