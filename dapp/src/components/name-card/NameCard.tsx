// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { MoreHoriz } from '@iota/apps-ui-icons';

import { MenuListItem, type NftDisplayProps } from '@/lib/types/components';

import { ContextMenuButton } from '../buttons/ContextMenuButton';
import { AvatarDisplay } from '../name-record/AvatarDisplay';

interface NameCardProps extends NftDisplayProps {
    menuOptions?: MenuListItem[];
}

export function NameCard({
    registrationNft,
    badge,
    size,
    menuOptions,
    children,
}: React.PropsWithChildren<NameCardProps>) {
    return (
        <div className="relative group/name-card rounded-xl overflow-hidden shadow-md bg-names-neutral-6">
            <AvatarDisplay
                registrationNft={registrationNft}
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
