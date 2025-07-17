// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import cx from 'clsx';
import { useEffect, useState } from 'react';

import { useNameRecord } from '@/hooks';
import { useGetObject } from '@/hooks/useGetOwnedObject';
import type { NftDisplayProps } from '@/lib/types/components';

import { nftDisplayVariants } from './variants';

const PLACEHOLDER_DISPLAY = `/placeholder-name-display.svg`;

interface AvatarDisplayProps extends NftDisplayProps {
    button?: React.ReactNode;
    fallbackUrl?: string;
}

export function AvatarDisplay({
    name,
    size,
    badge,
    button,
    fallbackUrl = PLACEHOLDER_DISPLAY,
}: AvatarDisplayProps) {
    const [showAvatar, setShowAvatar] = useState(false);

    const { data } = useNameRecord(name);

    const avatarId = data?.type === 'unavailable' ? data?.nameRecord.avatar : null;

    const { data: avatarObject } = useGetObject({
        id: avatarId ?? '',
        options: { showDisplay: true, showContent: true },
    });

    const avatarSrc = avatarObject?.display?.data?.image_url;

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

                <img
                    className="absolute inset-0 w-full h-full -z-[1] object-cover"
                    src={avatarSrc && showAvatar ? avatarSrc : fallbackUrl}
                    alt={name}
                />
            </div>
        </div>
    );
}
