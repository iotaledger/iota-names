// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonSize,
    ButtonType,
    Dialog,
    DialogBody,
    DialogContent,
    Header,
    LoadingIndicator,
    Title,
    VisualAssetCard,
} from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';
import { useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { useNameRecord, useRegistrationNfts } from '@/hooks';
import { useGetOwnedObject } from '@/hooks/useGetOwnedObject';
import { useGetVisualAssets } from '@/hooks/useGetVisualAssets';
import { useMutateNftDisplay } from '@/hooks/useMutateNftDisplay';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

export default function MyNamesPage(): JSX.Element {
    const registrationNfts = useRegistrationNfts();
    const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false);
    const [selectedNameRegistration, setSelectedNameRegistration] =
        useState<RegistrationNft | null>(null);

    function handleUpdateDisplayClick(registration: RegistrationNft) {
        setSelectedNameRegistration(registration);
        setIsNFTSelectorOpen(true);
    }

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-md">
                {registrationNfts?.map((nameRecord) => (
                    <NameDisplay
                        key={nameRecord.image_url}
                        registration={nameRecord}
                        onUpdateDisplayClick={() => handleUpdateDisplayClick(nameRecord)}
                    />
                ))}

                {selectedNameRegistration && (
                    <NftAvatarSelectDialog
                        open={isNFTSelectorOpen}
                        setOpen={setIsNFTSelectorOpen}
                        registration={selectedNameRegistration}
                    />
                )}
            </div>
        </div>
    );
}

interface NameDisplayProps {
    registration: RegistrationNft;
    onUpdateDisplayClick?: () => void;
}

function NameDisplay({ registration, onUpdateDisplayClick }: NameDisplayProps): React.JSX.Element {
    const {
        data,
        isLoading: isLoadingRegistration,
        isError: isErrorRegistration,
    } = useNameRecord(registration.name);
    const address = useCurrentAccount()?.address ?? '';

    const avatarId = data?.type === 'unavailable' ? data?.nameRecord.avatar : null;

    const {
        data: avatarObject,
        isLoading: isLoadingAvatarObject,
        isError: isErrorAvatarObject,
    } = useGetOwnedObject(address, avatarId);

    const imageUrl =
        isLoadingAvatarObject || isLoadingRegistration || isErrorAvatarObject || isErrorRegistration
            ? registration.image_url
            : avatarObject?.display?.data?.image_url || registration.image_url;

    const canChangeDisplay =
        registration.expiration_timestamp_ms && registration.expiration_timestamp_ms > Date.now();

    return (
        <div className="flex flex-col gap-xs items-center outline outline-1 outline-primary-80 rounded-lg">
            <img
                src={imageUrl}
                alt={registration.name}
                className="w-32 h-32 object-cover rounded-md outline outline-1 outline-primary-60"
            />

            <div>
                <Title title={registration.name} />
                {canChangeDisplay && (
                    <Button text="Update Display" onClick={onUpdateDisplayClick} />
                )}
            </div>
        </div>
    );
}

interface NftAvatarSelectDialogProps {
    open: boolean;
    setOpen: (bool: boolean) => void;
    registration: RegistrationNft;
}
function NftAvatarSelectDialog({ open, setOpen, registration }: NftAvatarSelectDialogProps) {
    const iotaClient = useIotaClient();
    const address = useCurrentAccount()?.address ?? '';
    const { data: visualAssets, isLoading } = useGetVisualAssets(address);
    const { mutateAsync: updateNFTDisplay } = useMutateNftDisplay(registration);

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
                        <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-md">
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
                    <Button size={ButtonSize.Small} text="Connect" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
