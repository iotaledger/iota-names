// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    Button,
    ButtonSize,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    LoadingIndicator,
    VisualAssetCard,
} from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';

import { useGetVisualAssets } from '@/hooks/useGetVisualAssets';

interface AvatarSelectDialogProps {
    setOpen: (bool: boolean) => void;
    onAssetClick: (assetId: string) => void;
}
export function VisualAssetsDialog({ setOpen, onAssetClick }: AvatarSelectDialogProps) {
    const address = useCurrentAccount()?.address ?? '';
    const { data: visualAssets, isLoading } = useGetVisualAssets(address);

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent showCloseOnOverlay customWidth="w-full max-w-[60vw]">
                <Header
                    title="Select NFT to use as Alias"
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
                        <div className="max-h-[600px] w-full grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-md">
                            {!visualAssets || visualAssets?.length === 0 ? (
                                <p>No NFTs found</p>
                            ) : (
                                visualAssets.map((asset) => (
                                    <VisualAssetCard
                                        assetSrc={asset.display?.data?.image_url || ''}
                                        altText={asset.display?.data?.name || 'NFT'}
                                        key={asset.objectId}
                                        isHoverable
                                        onClick={() => onAssetClick(asset.objectId)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </DialogBody>

                <div className="flex w-full flex-row justify-center gap-2 px-md--rs pb-md--rs pt-sm--rs">
                    <Button
                        size={ButtonSize.Small}
                        type={ButtonType.Outlined}
                        text="Cancel"
                        onClick={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
