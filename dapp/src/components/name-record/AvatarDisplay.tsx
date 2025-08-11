// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Loader } from '@iota/apps-ui-icons';
import { isSubname } from '@iota/iota-names-sdk';
import { useEffect, useState } from 'react';

import { useNameRecord, useRegistrationNfts } from '@/hooks';
import { useGetObject } from '@/hooks/useGetOwnedObject';

interface AvatarDisplayProps {
    name: string;
    fallbackUrl?: string;
}

export function AvatarDisplay({ name, fallbackUrl }: AvatarDisplayProps) {
    const [showAvatar, setShowAvatar] = useState(false);

    const { data: nameRecordData, isLoading: isNameRecordDataLoading } = useNameRecord(name);
    const { data: subnames, isLoading: isSubnamesLoading } = useRegistrationNfts('subname');
    const isNameSubname = isSubname(name);

    const avatarId =
        nameRecordData?.type === 'unavailable'
            ? isNameSubname
                ? subnames?.find((n) => n.name === name)?.id
                : (nameRecordData?.nameRecord.avatar ?? nameRecordData.nameRecord.nftId)
            : null;

    const { data: avatarObject, isLoading: isAvatarLoading } = useGetObject({
        id: avatarId ?? '',
        options: { showDisplay: true, showContent: true },
    });

    const isDataLoading = isNameRecordDataLoading || isSubnamesLoading || isAvatarLoading;
    const avatarSrc = isDataLoading
        ? null
        : (avatarObject?.display?.data?.image_url ?? fallbackUrl);

    useEffect(() => {
        if (!avatarSrc) return;

        const img = new Image();
        img.src = avatarSrc;

        img.onload = () => setShowAvatar(true);
        img.onerror = () => setShowAvatar(false);
    }, [avatarSrc]);

    return (
        <div className="w-full h-full flex flex-col relative rounded-xl overflow-hidden">
            {avatarSrc && showAvatar ? (
                <img
                    className="absolute inset-0 w-full h-full -z-[1] object-cover"
                    src={avatarSrc}
                    alt={name}
                />
            ) : (
                <div className="absolute inset-0 w-full h-full bg-names-neutral-4 flex items-center justify-center">
                    <Loader className="animate-spin" data-testid="loading-indicator" />
                </div>
            )}
        </div>
    );
}
