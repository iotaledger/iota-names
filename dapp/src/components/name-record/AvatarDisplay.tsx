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
    } = useGetObject({ id: avatarId ?? '', options: { showDisplay: true, showContent: true } });

    const mediaUrl =
        isLoadingAvatarObject || isLoadingRegistration || isErrorAvatarObject || isErrorRegistration
            ? registration.imageUrl
            : avatarObject?.display?.data?.image_url || registration.imageUrl;

    return mediaUrl && avatarObject ? (
        <img
            src={mediaUrl}
            alt={registration.name}
            className="w-full h-full object-cover rounded-lg"
        />
    ) : (
        <div className="w-full h-full bg-neutral-30/20 rounded-lg flex items-end justify-end">
            <small className="text-neutral-50 m-xs">
                {registration.name} - No avatar available
            </small>
        </div>
    );
}
