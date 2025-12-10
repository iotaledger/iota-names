// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Info, Loader, Warning } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    LoadingIndicator,
    TooltipPosition,
    VisualAssetCard,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { ALLOWED_METADATA, isSubname, normalizeIotaName } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
    NameRecordData,
    NameUpdate,
    queryKey,
    useNameRecord,
    useRegistrationNfts,
    useUpdateNameTransaction,
} from '@/hooks';
import { useGetVisualAssets } from '@/hooks/useGetVisualAssets';
import { getUserFriendlyErrorMessage } from '@/lib/utils';
import { ampli } from '@/lib/utils/analytics/ampli';
import { getNameObject } from '@/lib/utils/names';

import { NameAvatarDisplay } from '../name-record/AvatarDisplay';
import { TruncatedNameWithTooltip } from '../TruncatedNameWithTooltip';

interface PersonalizeAvatarDialogProps {
    name: string;
    setOpen: (bool: boolean) => void;
}

type SetAction =
    | {
          type: 'set';
          avatar: string;
      }
    | {
          type: 'unset';
      }
    | {
          type: 'none';
      };

export function PersonalizeAvatarDialog({ name, setOpen }: PersonalizeAvatarDialogProps) {
    const account = useCurrentAccount();
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const address = useCurrentAccount()?.address ?? '';

    const { data: nameRecordData } = useNameRecord(name);
    const { data: subnamesOwned } = useRegistrationNfts('subname');
    const { data: visualAssets, isLoading: isLoadingGetVisualAssets } = useGetVisualAssets(address);

    const [action, setAction] = useState<SetAction>({ type: 'none' });

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;
    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : null;
    const updates: NameUpdate[] = [];
    const currentAvatar = nameRecord?.nameRecord.avatar;

    // Sync current avatar with selection
    useEffect(() => {
        if (action.type == 'none' && currentAvatar) {
            setAction({
                type: 'set',
                avatar: currentAvatar,
            });
        }
    }, [currentAvatar]);

    // if (nameRecord) {
    if (nameRecord && isNameSubname !== null) {
        const nftId = isNameSubname
            ? getNameObject(subnamesOwned ?? [], nameRecord.nameRecord.name)
            : nameRecord.nameRecord.nftId;
        if (nftId) {
            if (action.type === 'set' && action.avatar !== currentAvatar) {
                updates.push({
                    type: 'set-data',
                    nftId,
                    key: ALLOWED_METADATA.avatar,
                    value: action.avatar,
                    isSubname: isNameSubname,
                });
            } else if (action.type === 'unset' && currentAvatar) {
                updates.push({
                    type: 'unset-data',
                    nftId,
                    key: ALLOWED_METADATA.avatar,
                    isSubname: isNameSubname,
                });
            }
        }
    }

    const {
        data: updateNameTransaction,
        isLoading: isUpdating,
        error: updateNameError,
    } = useUpdateNameTransaction({
        address: account?.address || '',
        updates,
    });

    const defaultAsset =
        visualAssets?.find((a) => a.objectId === nameRecord?.nameRecord.nftId) || null;

    const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } =
        useSignAndExecuteTransaction();

    const { mutate: saveAvatar, isPending: isSaving } = useMutation({
        async mutationFn() {
            if (!updateNameTransaction) return;
            const tx = await signAndExecuteTransaction({
                transaction: updateNameTransaction.transaction,
            });

            await iotaClient.waitForTransaction({ digest: tx.digest });

            queryClient.invalidateQueries({ queryKey: queryKey.nameRecord(name) });
        },
        onSuccess() {
            if (action.type === 'set') {
                ampli.setAvatar({
                    name,
                    setAvatar: true,
                });
            }

            if (action.type === 'unset') {
                ampli.setAvatar({
                    name,
                    setAvatar: false,
                });
            }
            setOpen(false);
            toast.success(
                `Successfully updated avatar for ${normalizeIotaName(name, 'at', { truncateLongParts: true })}`,
            );
        },
        onError: (error) => {
            toast.error(getUserFriendlyErrorMessage(error));
        },
    });

    function handleUnset() {
        setAction({
            type: 'unset',
        });
    }

    function handleSave() {
        if (!updateNameTransaction) return;
        saveAvatar();
    }
    const selectedAsset =
        action.type === 'set'
            ? visualAssets?.find((a) => a.objectId === action.avatar)
            : action.type === 'unset'
              ? defaultAsset
              : currentAvatar
                ? visualAssets?.find((a) => a.objectId === currentAvatar)
                : defaultAsset;

    const isLoadingData = isLoadingGetVisualAssets;
    const isLoading = isUpdating || isLoadingData || isSaving || isSigning;
    const disableUnset = !currentAvatar || isLoading || updates.length > 0;
    const disableSave = isLoading || updates.length === 0 || !updateNameTransaction;

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent
                customWidth="w-full max-w-[90vw] md:max-w-[50vw] xl:max-w-[60vw]"
                position={DialogPosition.Right}
            >
                <Header title="Personalize Avatar" onClose={() => setOpen(false)} />

                <DialogBody>
                    <div className="flex flex-col gap-md items-center">
                        <div className="flex flex-col gap-md items-start w-full">
                            <div className="flex flex-row gap-lg p-[2px] rounded-xl bg-names-neutral-10 items-center w-full">
                                <div className="w-28 h-28">
                                    {selectedAsset ? (
                                        <VisualAssetCard
                                            src={selectedAsset.display?.data?.image_url || ''}
                                            altText={selectedAsset.display?.data?.name || 'NFT'}
                                            isHoverable={false}
                                        />
                                    ) : (
                                        <NameAvatarDisplay name={name} />
                                    )}
                                </div>

                                <div className="flex flex-col gap-xxs">
                                    <p className="text-names-neutral-92 text-title-md">
                                        <TruncatedNameWithTooltip
                                            name={name}
                                            tooltipPosition={TooltipPosition.Top}
                                        />
                                    </p>

                                    <p className="text-names-neutral-70 text-body-md">NFT Name</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-xxs text-start w-full">
                                <div className="flex flex-row gap-xxs text-title-md text-names-neutral-92 w-full text-start">
                                    <p>Personalize</p>
                                    <TruncatedNameWithTooltip
                                        name={name}
                                        tooltipPosition={TooltipPosition.Top}
                                    />
                                </div>

                                <span className="text-body-md text-names-neutral-70">
                                    Use an NFT to personalize your avatar
                                </span>
                            </div>
                        </div>

                        {isLoadingData ? (
                            <div className="flex items-center justify-center w-full h-full py-lg">
                                <LoadingIndicator text="Loading Assets..." />
                            </div>
                        ) : !visualAssets || visualAssets?.length === 0 ? (
                            <div className="flex items-center justify-center w-full py-lg">
                                <InfoBox
                                    title="No Eligible NFTs"
                                    supportingText="There are no NFTs in your wallet that can be used as an avatar"
                                    icon={<Info />}
                                    type={InfoBoxType.Warning}
                                    style={InfoBoxStyle.Default}
                                />
                            </div>
                        ) : (
                            <div className="max-h-[400px] w-full grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-md">
                                {visualAssets.map((asset) => {
                                    const isSelected =
                                        action.type === 'set' && action.avatar === asset.objectId;

                                    return (
                                        <div
                                            key={asset.objectId}
                                            data-testid="avatar-nft-card"
                                            data-object-id={asset.objectId}
                                            data-selected={isSelected ? 'true' : 'false'}
                                            className={`rounded-xl p-[1px] transition-all ${
                                                isSelected
                                                    ? 'bg-names-gradient-primary'
                                                    : 'bg-transparent'
                                            }`}
                                        >
                                            <div className="bg-names-neutral-6 rounded-xl">
                                                <VisualAssetCard
                                                    src={asset.display?.data?.image_url || ''}
                                                    altText={asset.display?.data?.name || 'NFT'}
                                                    isHoverable
                                                    onClick={() => {
                                                        setAction({
                                                            type: 'set',
                                                            avatar: asset.objectId,
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogBody>
                <div className="flex flex-col gap-y-md gap-2 p-md--rs">
                    {updateNameError ? (
                        <InfoBox
                            type={InfoBoxType.Error}
                            style={InfoBoxStyle.Elevated}
                            icon={<Warning />}
                            title="Error"
                            supportingText={getUserFriendlyErrorMessage(updateNameError)}
                        />
                    ) : null}
                    <div className="flex w-full flex-row gap-x-xs">
                        <Button
                            type={ButtonType.Secondary}
                            text="Cancel"
                            onClick={() => setOpen(false)}
                            fullWidth
                        />
                        <Button
                            type={ButtonType.Primary}
                            text="Unset avatar"
                            onClick={handleUnset}
                            disabled={disableUnset}
                            fullWidth
                            icon={
                                isLoading ? (
                                    <Loader
                                        className="animate-spin"
                                        data-testid="loading-indicator"
                                    />
                                ) : null
                            }
                        />
                        <Button
                            type={ButtonType.Primary}
                            text="Save"
                            onClick={handleSave}
                            disabled={disableSave}
                            fullWidth
                            icon={
                                isLoading ? (
                                    <Loader
                                        className="animate-spin"
                                        data-testid="loading-indicator"
                                    />
                                ) : null
                            }
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
