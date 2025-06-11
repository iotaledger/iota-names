// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useNameRecord } from '@/hooks';
import { useGetOwnedObject } from '@/hooks/useGetOwnedObject';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

interface NameRecordDisplayProps {
    registration: RegistrationNft;
    ownerAddress: string;
}

export function NameRecordDisplay({ registration, ownerAddress }: NameRecordDisplayProps) {
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
    } = useGetOwnedObject(ownerAddress, avatarId);

    const mediaUrl =
        isLoadingAvatarObject || isLoadingRegistration || isErrorAvatarObject || isErrorRegistration
            ? registration.image_url
            : avatarObject?.display?.data?.image_url || registration.image_url;

    return <img src={mediaUrl} alt={registration.name} className="w-full h-full object-cover" />;
}
