// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    Button,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
    LoadingIndicator,
    VisualAssetCard,
} from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { useState } from 'react';

import { useGetVisualAssets } from '@/hooks/useGetVisualAssets';
import { sanitizeIotaName } from '@/lib/utils';
import { BrandedAssets } from '@/public/icons';

interface AvatarSelectDialogProps {
    setOpen: (bool: boolean) => void;
    onAssetClick: (assetId: string) => void;
    name: string;
}
export function VisualAssetsDialog({ setOpen, onAssetClick, name }: AvatarSelectDialogProps) {
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    const address = useCurrentAccount()?.address ?? '';
    const { data: visualAssets, isLoading } = useGetVisualAssets(address);
    const cleanName = sanitizeIotaName(name);

    const filteredVisualAssets = visualAssets?.filter(
        (asset) =>
            !asset.display?.data?.name?.includes('.iota') && !!asset.display?.data?.image_url,
    );

    function handleSelectAsset() {
        if (selectedAssetId) {
            onAssetClick(selectedAssetId);
            setOpen(false);
        }
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
                    {isLoading ? (
                        <div className="flex items-center justify-center w-full h-full min-h-[200px]">
                            <LoadingIndicator text="Loading Assets..." />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-md items-center">
                            <div className="flex flex-col gap-md items-center">
                                <BrandedAssets className="w-12 h-12" />
                                <div className="flex flex-col gap-xxs text-center">
                                    <span className="text-title-md text-names-neutral-92">
                                        Personalize @{cleanName}
                                    </span>
                                    <span className="text-body-md text-names-neutral-70">
                                        Use an NFT to personalize your avatar
                                    </span>
                                </div>
                            </div>

                            {!filteredVisualAssets || filteredVisualAssets?.length === 0 ? (
                                <p>No NFTs found</p>
                            ) : (
                                <div className="max-h-[400px] w-full grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-md">
                                    {filteredVisualAssets.map((asset) => {
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
                    )}
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
                        text="Upload Avatar"
                        onClick={handleSelectAsset}
                        fullWidth
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
