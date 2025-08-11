// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { isSubname } from '@iota/iota-names-sdk';
import cx from 'clsx';
import { useEffect, useState } from 'react';

import loadingAnimationData from '@/animations/lottie-loading.json';
import { useNameRecord, useRegistrationNfts } from '@/hooks';
import { useGetObject } from '@/hooks/useGetOwnedObject';
import type { NftDisplayProps } from '@/lib/types/components';

import { LottieAnimation } from '../loaders/Lottie';
import { nftDisplayVariants } from './variants';

interface AvatarDisplayProps extends NftDisplayProps {
    button?: React.ReactNode;
    fallbackUrl?: string;
}

export function AvatarDisplay({ name, size, badge, button, fallbackUrl }: AvatarDisplayProps) {
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
        <div
            className={cx(
                'flex flex-col relative aspect-square rounded-xl group/display z-0',
                nftDisplayVariants({ size }),
            )}
        >
            <div className="w-full h-full flex flex-col relative rounded-xl overflow-hidden">
                {badge && <div className="absolute top-sm left-sm">{badge}</div>}
                {button && (
                    <div className="opacity-0 group-hover/display:opacity-100 transition-opacity absolute w-full top-0 right-0 px-sm py-sm bg-gradient-to-b from-black/80 to-transparent flex justify-end pointer-events-none">
                        <div className="shadow-xl pointer-events-auto">{button}</div>
                    </div>
                )}

                {avatarSrc && showAvatar ? (
                    <img
                        className="absolute inset-0 w-full h-full -z-[1] object-cover"
                        src={avatarSrc}
                        alt={name}
                    />
                ) : (
                    <div className="w-full aspect-square relative">
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                            <LottieAnimation
                                animationData={loadingAnimationData}
                                className="w-16 h-16"
                            />
                        </div>
                        <img className={cx('w-full', 'block')} src="/name-bg.svg" />
                    </div>
                )}
            </div>
        </div>
    );
}
