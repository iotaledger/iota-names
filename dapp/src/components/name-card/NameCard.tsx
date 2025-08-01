// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import cx from 'clsx';

import { nftDisplayVariants } from '@/components/name-record/variants';
import { MenuListItem, type NftDisplayProps } from '@/lib/types/components';

import { ContextMenuButton } from '../buttons/ContextMenuButton';
import { AvatarDisplay } from '../name-record/AvatarDisplay';

interface NameCardProps extends NftDisplayProps {
    menuOptions?: MenuListItem[];
    isSelected?: boolean;
    displaySrc?: string;
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
    return (
        <div
            className={cx(
                'relative group/name-card rounded-xl shadow-md bg-names-neutral-6 overflow-visible',
                isSelected && 'name-card-selected',
                nftDisplayVariants({ size }),
            )}
        >
            {displaySrc ? (
                <img src={displaySrc} alt={name} />
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
