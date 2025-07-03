// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { MoreHoriz } from '@iota/apps-ui-icons';

import { MenuListItem } from '@/lib/types/components';

import { ContextMenuButton } from '../buttons/ContextMenuButton';
import { NameCardSize } from './helpers/enums';
import { CommonNameCardProps } from './helpers/interfaces';
import { NameNftDisplay } from './NameNftDisplay';

interface NameCardProps extends CommonNameCardProps {
    menuOptions?: MenuListItem[];
}

export function NameCard({
    name,
    subname,
    expiration,
    image,
    badge,
    size = NameCardSize.Medium,
    menuOptions,
    children,
}: React.PropsWithChildren<NameCardProps>) {
    return (
        <div className="relative group/name-card rounded-xl overflow-hidden shadow-md bg-names-neutral-6">
            <NameNftDisplay
                name={name}
                subname={subname}
                expiration={expiration}
                image={image}
                size={size}
                badge={badge}
                button={<ContextMenuButton icon={<MoreHoriz />} options={menuOptions ?? []} />}
            />

            {children}
        </div>
    );
}
