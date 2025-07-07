// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { MoreHoriz } from '@iota/apps-ui-icons';
import cx from 'clsx';

import { nftDisplayVariants } from '@/components/name-record/variants';
import { MenuListItem, type NftDisplayProps } from '@/lib/types/components';

import { ContextMenuButton } from '../buttons/ContextMenuButton';
import { AvatarDisplay } from '../name-record/AvatarDisplay';

interface NameCardProps extends NftDisplayProps {
    menuOptions?: MenuListItem[];
}

export function NameCard({
    name,
    badge,
    size,
    menuOptions,
    children,
}: React.PropsWithChildren<NameCardProps>) {
    return (
        <div
            className={cx(
                'relative group/name-card rounded-xl overflow-hidden shadow-md bg-names-neutral-6',
                nftDisplayVariants({ size }),
            )}
        >
            <AvatarDisplay
                name={name}
                size={size}
                badge={badge}
                button={
                    menuOptions && <ContextMenuButton icon={<MoreHoriz />} options={menuOptions} />
                }
            />

            {children}
        </div>
    );
}
