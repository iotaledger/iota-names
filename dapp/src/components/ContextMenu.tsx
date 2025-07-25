// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Dropdown, ListItem } from '@iota/apps-ui-kit';
import { createPortal } from 'react-dom';

import { MenuListItem } from '@/lib/types/components';

interface ContextMenuProps {
    visible: boolean;
    position: { top: number; left: number };
    options: MenuListItem[];
    dropdownRef: (el: HTMLDivElement | null) => void;
    closeMenu: () => void;
}

export function ContextMenuDropdown({
    visible,
    position,
    options,
    dropdownRef,
    closeMenu,
}: ContextMenuProps) {
    if (!visible) return null;

    return createPortal(
        <div
            ref={dropdownRef}
            className="z-50 fixed"
            style={{ top: position.top, left: position.left }}
        >
            <Dropdown>
                {options
                    .filter((option) => !option.isHidden)
                    .map((item, index) => (
                        <ListItem
                            key={index}
                            {...item}
                            onClick={() => {
                                item.onClick?.();
                                closeMenu();
                            }}
                        />
                    ))}
            </Dropdown>
        </div>,
        document.body,
    );
}
