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
            ? isNameSubname
                ? subnames?.find((n) => n.name === name)?.id
                : (nameRecordData?.nameRecord.avatar ?? nameRecordData.nameRecord.nftId)
            : null;

    const { data: avatarObject, isLoading: isAvatarLoading } = useGetObject({
        id: avatarId ?? '',
        options: { showDisplay: true, showContent: true },
    });

    const isDataLoading = isNameRecordDataLoading || isSubnamesLoading || isAvatarLoading;

    return (
        <AvatarDisplay
            src={avatarObject?.display?.data?.image_url}
            isLoadingSrc={isDataLoading}
            alt={name}
        ></AvatarDisplay>
    );
}

interface AvatarDisplayProps {
    src?: string;
    isLoadingSrc?: boolean;
    alt?: string;
}

export function AvatarDisplay({ src, alt, isLoadingSrc }: AvatarDisplayProps) {
    const [avatarSrc, setAvatarSrc] = useState<null | string>(null);

    useEffect(() => {
        if (src) {
            setAvatarSrc(src);
        } else if (!isLoadingSrc) {
            setAvatarSrc(FALLBACK_URL);
        }
    }, [src, isLoadingSrc]);

    useEffect(() => {
        if (!avatarSrc) return;

        const img = new Image();
        img.src = avatarSrc;

        img.onerror = () => setAvatarSrc(FALLBACK_URL);
    }, [avatarSrc]);

    return (
        <div className="w-full h-full flex flex-col relative rounded-xl overflow-hidden">
            {isLoadingSrc ? (
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
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        {avatarSrc === FALLBACK_URL ? <span>No Image</span> : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
