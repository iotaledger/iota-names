// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import cx from 'clsx';
import { useState } from 'react';

import { nftDisplayVariants } from '@/components/name-record/variants';
import { MenuListItem, type NftDisplayProps } from '@/lib/types/components';

import { ContextMenuButton } from '../buttons/ContextMenuButton';
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
                'relative group/name-card rounded-xl shadow-md bg-names-neutral-6 overflow-visible',
                isSelected && 'name-card-selected',
                nftDisplayVariants({ size }),
            )}
        >
            {displaySrc ? (
                <div className="w-full aspect-square">
                    <img
                        className={cx('w-full', !imageLoaded ? 'block' : 'hidden')}
                        src="/name-bg.svg"
                    />
                    <img
                        src={displaySrc}
                        alt={name}
                        className={cx('w-full', imageLoaded ? 'block' : 'hidden')}
                        onLoad={() => setImageLoaded(true)}
                    />
                </div>
            ) : (
                <AvatarDisplay
                    name={name}
                    size={size}
                    badge={badge}
                    button={menuOptions ? <ContextMenuButton options={menuOptions} /> : null}
                />
            )}
            <div className={nftDisplayVariants({ size })}>{children}</div>
        </div>
    );
}
