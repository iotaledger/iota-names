// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Dropdown, ListItem } from '@iota/apps-ui-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { MenuListItem } from '@/lib/types/components';

import { FloatingButton } from './FloatingButton';

interface ContextMenuButtonProps {
    icon: React.ReactNode;
    options: MenuListItem[];
    className?: string;
}

export function ContextMenuButton({ icon, options, className }: ContextMenuButtonProps) {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    });

    const toggleDropdown = useCallback(() => {
        setIsDropdownVisible((prev) => {
            const newVisible = !prev;

            if (newVisible && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const top = rect.bottom + 8;
                const left = Math.min(rect.left, window.innerWidth - 200);

                setDropdownPosition({ top, left });
            }

            return newVisible;
        });
    }, [buttonRef]);

    useEffect(() => {
        if (!isDropdownVisible) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                buttonRef.current &&
                !buttonRef.current.contains(target)
            ) {
                setIsDropdownVisible(false);
            }
        };

        const handleResize = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({ top: rect.bottom + 8, left: rect.left });
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownVisible]);

    return (
        <>
            <div className={className} ref={buttonRef}>
                <FloatingButton icon={icon} onClick={toggleDropdown} />
            </div>

            {isDropdownVisible &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="z-50 fixed"
                        style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                        }}
                    >
                        <Dropdown>
                            {options.map((item, index) => (
                                <ListItem key={index} {...item} />
                            ))}
                        </Dropdown>
                    </div>,
                    document.body,
                )}
        </>
    );
}
