// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useNameRecord } from '@/hooks';
import { useGetObject } from '@/hooks/useGetOwnedObject';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

interface AvatarDisplayProps {
    registration: RegistrationNft;
}

export function AvatarDisplay({ registration }: AvatarDisplayProps) {
    const {
        data,
        isLoading: isLoadingRegistration,
        isError: isErrorRegistration,
    } = useNameRecord(registration.name);

    const avatarId = data?.type === 'unavailable' ? data?.nameRecord.avatar : null;

    const {
        data: avatarObject,
        isLoading: isLoadingAvatarObject,
        isError: isErrorAvatarObject,
    } = useGetObject(avatarId);

    const mediaUrl =
        isLoadingAvatarObject || isLoadingRegistration || isErrorAvatarObject || isErrorRegistration
            ? registration.image_url
            : avatarObject?.display?.data?.image_url || registration.image_url;

    return <img src={mediaUrl} alt={registration.name} className="w-full h-full object-cover" />;
}
