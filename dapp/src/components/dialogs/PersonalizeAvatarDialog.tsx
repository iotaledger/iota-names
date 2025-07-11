// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Info, Loader } from '@iota/apps-ui-icons';
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
    VisualAssetCard,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { isSubname } from '@iota/iota-names-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
    NameRecordData,
    NameUpdate,
    queryKey,
    useNameRecord,
    useRegistrationNfts,
    useUpdateNameTransaction,
} from '@/hooks';
import { useGetVisualAssets } from '@/hooks/useGetVisualAssets';
import { normalizeNameInput } from '@/lib/utils/format/formatNames';
import { getNameObject } from '@/lib/utils/names';
import { BrandedAssets } from '@/public/icons';

interface PersonalizeAvatarDialogProps {
    setOpen: (bool: boolean) => void;
    name: string;
}
export function PersonalizeAvatarDialog({ setOpen, name }: PersonalizeAvatarDialogProps) {
    const account = useCurrentAccount();
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const address = useCurrentAccount()?.address ?? '';

    const { data: nameRecordData } = useNameRecord(name);
    const { data: subnamesOwned } = useRegistrationNfts('subname');
    const { data: visualAssets, isLoading } = useGetVisualAssets(address);

    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;
    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : null;
    const cleanName = normalizeNameInput(name);
    const updates: NameUpdate[] = [];

    if (selectedAssetId && selectedAssetId !== nameRecord?.nameRecord.avatar && nameRecord) {
        const nftId = isNameSubname
            ? getNameObject(subnamesOwned ?? [], nameRecord.nameRecord.name)
            : nameRecord.nameRecord.nftId;
        if (nftId) {
            updates.push({
                type: 'set-avatar',
                nftId,
                avatarNftId: selectedAssetId,
            });
        }
    }

    const { data: updateTransaction } = useUpdateNameTransaction({
        address: account?.address || '',
        updates,
    });

    const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } =
        useSignAndExecuteTransaction();

    const { mutate: saveAvatar, isPending: isSaving } = useMutation({
        async mutationFn() {
            if (!updateTransaction) return;
            const tx = await signAndExecuteTransaction({ transaction: updateTransaction });

            await iotaClient.waitForTransaction({ digest: tx.digest });

            queryClient.invalidateQueries({ queryKey: queryKey.nameRecord(name) });
        },
        onSuccess() {
            setOpen(false);
        },
    });

    function handleSelectAsset() {
        if (!selectedAssetId || !updateTransaction) return;
        saveAvatar();
    }
    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent
                customWidth="w-full max-w-[90vw] md:max-w-[50vw] xl:max-w-[60vw]"
                position={DialogPosition.Right}
            >
                <Header
                    title="Personalize Avatar"
                    titleCentered
                    onClose={() => setOpen(false)}
                    onBack={() => setOpen(false)}
                />

                <DialogBody>
                    <div className="flex flex-col gap-md items-center">
                        <div className="flex flex-col gap-md items-center">
                            <BrandedAssets className="w-12 h-12" />
                            <div className="flex flex-col gap-xs text-center">
                                <span className="text-title-md text-names-neutral-92">
                                    @{cleanName}
                                </span>
                                <span className="text-body-md text-names-neutral-70">
                                    Use an NFT to personalize your avatar
                                </span>
                            </div>
                        </div>
                        {isLoading ? (
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
                                    const isSelected = selectedAssetId === asset.objectId;

                                    return (
                                        <div
                                            key={asset.objectId}
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
                                                    onClick={() =>
                                                        setSelectedAssetId(asset.objectId)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogBody>

                <div className="flex w-full flex-row justify-center gap-2 px-md--rs pb-md--rs pt-md--rs">
                    <Button
                        type={ButtonType.Secondary}
                        text="Cancel"
                        onClick={() => setOpen(false)}
                        fullWidth
                    />
                    <Button
                        type={ButtonType.Primary}
                        text={isSaving || isSigning ? 'Uploading...' : 'Upload Avatar'}
                        onClick={handleSelectAsset}
                        disabled={isSaving || isSigning || !selectedAssetId}
                        fullWidth
                        icon={
                            isSaving || isSigning ? (
                                <Loader className="animate-spin" data-testid="loading-indicator" />
                            ) : null
                        }
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
