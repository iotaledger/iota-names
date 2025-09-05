// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Dropdown, ListItem } from '@iota/apps-ui-kit';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { MenuListItem } from '@/lib/types/components';

interface ContextMenuProps {
    visible: boolean;
    position: { top: number; left: number };
    options: MenuListItem[];
    dropdownRef: (el: HTMLDivElement | null) => void;
}

export function ContextMenuDropdown({ visible, position, options, dropdownRef }: ContextMenuProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [style, setStyle] = useState<React.CSSProperties>({});
    const localRef = useRef<HTMLDivElement | null>(null);
    const measuredHeightRef = useRef<number>(0);

    useEffect(() => {
        setIsMobile(window.innerWidth < 900);
    }, []);

    const recomputePosition = () => {
        if (!visible) return;
        const dropdownEl = localRef.current;
        if (!dropdownEl) return;

        const rect = dropdownEl.getBoundingClientRect();
        const height = rect.height || measuredHeightRef.current || 0;
        const { innerHeight } = window;
        const margin = 8;

        const base: React.CSSProperties = isMobile
            ? { left: '50%', transform: 'translateX(-50%)', maxWidth: '92vw' }
            : { left: position.left };

        const safeHeight = height > 0 ? height : 1;

        const isPositionedBelow = position.top + safeHeight + margin <= innerHeight;
        if (isPositionedBelow) {
            base.top = position.top;
        } else {
            base.top = Math.max(margin, position.top - safeHeight - 50);
        }

        setStyle(base);
    };

    useLayoutEffect(() => {
        if (!visible) return;

        const currentElement = localRef.current;
        if (!currentElement) return;

        const raf = requestAnimationFrame(() => {
            const rect = currentElement.getBoundingClientRect();
            if (rect.height) measuredHeightRef.current = rect.height;
            recomputePosition();
        });

        return () => {
            cancelAnimationFrame(raf);
        };
    }, [visible]);

    if (!visible) return null;

    return createPortal(
        <div
            ref={(dropdownElement) => {
                localRef.current = dropdownElement;
                dropdownRef(dropdownElement);
            }}
            className="fixed z-50"
            style={style}
        >
            <div className="max-w-[92vw] md:max-w-none">
                <Dropdown>
                    {options
                        .filter((option) => !option.isHidden)
                        .map((item, index) => (
                            <ListItem key={index} {...item} />
                        ))}
                </Dropdown>
            </div>
        </div>,
        document.body,
    );
}
