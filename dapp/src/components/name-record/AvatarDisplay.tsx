// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { isSubname } from '@iota/iota-names-sdk';
import cx from 'clsx';
import { useEffect, useState } from 'react';

import loadingAnimationData from '@/animations/lottie-loading.json';
import { useNameRecord, useRegistrationNfts } from '@/hooks';
import { useGetObject } from '@/hooks/useGetOwnedObject';

import { LottieAnimation } from '../loaders/Lottie';
import { NamesLogoBranded } from '../svgs';

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
            {isDataLoading ? (
                <div className="w-full aspect-square relative">
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <LottieAnimation
                            animationData={loadingAnimationData}
                            className="w-16 h-16"
                        />
                    </div>
                    <img className={cx('w-full', 'block')} src="/name-bg.svg" />
                </div>
            ) : avatarSrc && showAvatar ? (
                <img
                    className="absolute inset-0 w-full h-full -z-[1] object-cover"
                    src={avatarSrc}
                    alt={name}
                />
            ) : (
                <div className="w-full aspect-square relative">
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <NamesLogoBranded className="w-[14.71px] h-[22.97px] mr-sm" />
                        Couldn't load avatar
                    </div>
                    <img className={cx('w-full', 'block')} src="/name-bg.svg" />
                </div>
            )}
        </div>
    );
}
