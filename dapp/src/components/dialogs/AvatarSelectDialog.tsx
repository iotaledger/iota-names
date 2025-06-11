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
import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';

import { useGetVisualAssets } from '@/hooks/useGetVisualAssets';
import { useUpdateNftDisplay } from '@/hooks/useUpdateNftDisplay';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

interface AvatarSelectDialogProps {
    open: boolean;
    setOpen: (bool: boolean) => void;
    registration: RegistrationNft;
}
export function AvatarSelectDialog({ open, setOpen, registration }: AvatarSelectDialogProps) {
    const iotaClient = useIotaClient();
    const address = useCurrentAccount()?.address ?? '';
    const { data: visualAssets, isLoading } = useGetVisualAssets(address);
    const { mutateAsync: updateNFTDisplay } = useUpdateNftDisplay(registration);

    async function handleUpdateDisplay(newNftId: string) {
        if (!registration) {
            console.error('No name registration selected');
            return;
        }

        const result = await updateNFTDisplay({
            newNftId,
        });

        setOpen(false);

        iotaClient
            .waitForTransaction({
                digest: result.digest,
            })
            .then(() => {
                console.log('Display updated successfully', result.digest);
            });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                            {visualAssets.length === 0 ? (
                                <p>No NFTs found</p>
                            ) : (
                                visualAssets.map((asset) => (
                                    <VisualAssetCard
                                        assetSrc={asset.display?.data?.image_url || ''}
                                        altText={asset.display?.data?.name || 'NFT'}
                                        key={asset.objectId}
                                        isHoverable
                                        onClick={() => handleUpdateDisplay(asset.objectId)}
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
