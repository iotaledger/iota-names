// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import cx from 'clsx';
import { useState } from 'react';

import loadingAnimationData from '@/animations/lottie-loading.json';
import { nftDisplayVariants } from '@/components/name-record/variants';
import { MenuListItem, type NftDisplayProps } from '@/lib/types/components';

import { ContextMenuButton } from '../buttons/ContextMenuButton';
import { LottieAnimation } from '../loaders/Lottie';
import { AvatarDisplay } from '../name-record/AvatarDisplay';

interface NameCardProps extends NftDisplayProps {
    menuOptions?: MenuListItem[];
    isSelected?: boolean;
    displaySrc?: string | null;
}

export function NameCard({
    name,
    badge,
    size,
    menuOptions,
    isSelected,
    children,
    displaySrc,
}: React.PropsWithChildren<NameCardProps>) {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div
            className={cx(
                'relative group/name-card rounded-xl name-card-shadow bg-names-neutral-6 overflow-visible',
                isSelected && 'name-card-selected',
                nftDisplayVariants({ size }),
            )}
        >
            <div
                className={cx(
                    'flex flex-col relative aspect-square rounded-xl group/display z-0 overflow-hidden w-full',
                )}
            >
                {displaySrc ? (
                    <div className="w-full relative">
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LottieAnimation
                                    animationData={loadingAnimationData}
                                    className="w-16 h-16"
                                />
                            </div>
                        )}
                        <img
                            className={cx('w-full', !imageLoaded ? 'block' : 'hidden')}
                            src="/name-bg.svg"
                        />
                        <img
                            src={displaySrc}
                            alt={name}
                            className={cx(
                                'w-full absolute inset-0',
                                imageLoaded ? 'block' : 'hidden',
                            )}
                            onLoad={() => setImageLoaded(true)}
                        />
                    </div>
                ) : (
                    <AvatarDisplay name={name} />
                )}

                {badge && <div className="absolute top-sm left-sm">{badge}</div>}
                {menuOptions?.length ? (
                    <div className="opacity-0 group-hover/display:opacity-100 transition-opacity absolute w-full top-0 right-0 px-sm py-sm bg-gradient-to-b from-black/80 to-transparent flex justify-end pointer-events-none">
                        <div className="shadow-xl pointer-events-auto">
                            <ContextMenuButton options={menuOptions} />
                        </div>
                    </div>
                ) : null}
            </div>

            <div className={nftDisplayVariants({ size })}>{children}</div>
        </div>
    );
}
