// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { isSubname } from '@iota/iota-names-sdk';
import cx from 'clsx';
import { useEffect, useState } from 'react';

import loadingAnimationData from '@/animations/lottie-loading.json';
import { useNameRecord, useRegistrationNfts } from '@/hooks';
import { useGetObject } from '@/hooks/useGetOwnedObject';

import { LottieAnimation } from '../loaders/Lottie';

const FALLBACK_URL = '/name-bg.svg';

interface NameAvatarDisplay {
    name: string;
}

export function NameAvatarDisplay({ name }: NameAvatarDisplay) {
    const { data: nameRecordData, isLoading: isNameRecordDataLoading } = useNameRecord(name);
    const { data: subnames, isLoading: isSubnamesLoading } = useRegistrationNfts('subname');
    const isNameSubname = isSubname(name);

    const avatarId =
        nameRecordData?.type === 'unavailable'
            ? nameRecordData?.nameRecord.avatar
                ? nameRecordData.nameRecord.avatar
                : isNameSubname
                  ? subnames?.find((n) => n.name === name)?.id
                  : nameRecordData.nameRecord.nftId
            : null;

    const { data: avatarObject, isLoading: isAvatarLoading } = useGetObject(name, {
        id: avatarId ?? '',
        options: { showDisplay: true, showContent: true },
    });

    const isDataLoading = isNameRecordDataLoading || isSubnamesLoading || isAvatarLoading;

    return (
        <AvatarDisplay
            src={avatarObject?.display?.data?.image_url}
            isLoadingSrc={isDataLoading}
            alt={name}
        />
    );
}

interface AvatarDisplayProps {
    src?: string;
    isLoadingSrc?: boolean;
    alt?: string;
}

export function AvatarDisplay({ src, alt, isLoadingSrc }: AvatarDisplayProps) {
    const [avatarSrc, setAvatarSrc] = useState<null | string>(null);
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

    useEffect(() => {
        if (src) {
            setAvatarSrc(src);
        } else if (!isLoadingSrc) {
            // If there is no src even after loading we render the fallback
            setAvatarSrc(FALLBACK_URL);
        }
    }, [src, isLoadingSrc]);

    useEffect(() => {
        if (!avatarSrc) return;

        setIsLoadingAvatar(true);

        const img = new Image();
        img.src = avatarSrc;

        img.onload = () => setIsLoadingAvatar(false);
        // Render the fallback if the src fails
        img.onerror = () => setAvatarSrc(FALLBACK_URL);
    }, [avatarSrc]);

    return (
        <div className="flex flex-col relative rounded-xl overflow-hidden w-full h-full select-none">
            {isLoadingSrc || isLoadingAvatar ? (
                <div className="w-full aspect-square relative">
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <LottieAnimation
                            animationData={loadingAnimationData}
                            className="w-16 h-16"
                        />
                    </div>
                    <img className={cx('w-full', 'block')} src="/name-bg.svg" />
                </div>
            ) : avatarSrc ? (
                <div className="w-full aspect-square relative">
                    <img
                        className="absolute inset-0 w-full h-full object-cover"
                        src={avatarSrc}
                        alt={alt}
                    />
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center font-roboto-flex text-md font-semibold">
                        {avatarSrc === FALLBACK_URL ? <span>Couldn't load avatar</span> : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
