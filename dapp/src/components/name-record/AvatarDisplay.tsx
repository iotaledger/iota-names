// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useState } from 'react';

import { useNameRecord } from '@/hooks';
import { useGetObject } from '@/hooks/useGetOwnedObject';
import type { NftDisplayProps } from '@/lib/types/components';

import { NameCardDisplay } from '../name-card/NameCardDisplay';

const PLACEHOLDER_DISPLAY = `/placeholder-name-display.svg`;

interface AvatarDisplayProps extends NftDisplayProps {
    button?: React.ReactNode;
}

export function AvatarDisplay({ registrationNft, size, badge, button }: AvatarDisplayProps) {
    const [showPlaceholder, setShowPlaceholder] = useState(false);

    const {
        data,
        isLoading: isLoadingRegistration,
        isError: isErrorRegistration,
    } = useNameRecord(registrationNft.name);

    const avatarId = data?.type === 'unavailable' ? data?.nameRecord.avatar : null;

    const {
        data: avatarObject,
        isLoading: isLoadingAvatarObject,
        isError: isErrorAvatarObject,
    } = useGetObject({ id: avatarId ?? '', options: { showDisplay: true, showContent: true } });

    const fallbackImage = showPlaceholder
        ? PLACEHOLDER_DISPLAY
        : registrationNft?.imageUrl || PLACEHOLDER_DISPLAY;

    const mediaUrl =
        isLoadingAvatarObject || isLoadingRegistration || isErrorAvatarObject || isErrorRegistration
            ? fallbackImage
            : avatarObject?.display?.data?.image_url || fallbackImage;

    return (
        <NameCardDisplay
            size={size}
            src={mediaUrl}
            alt={registrationNft.name}
            badge={badge}
            button={button}
            onError={() => setShowPlaceholder(true)}
        />
    );
}
