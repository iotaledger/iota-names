// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { ButtonUnstyled } from '@iota/apps-ui-kit';

interface FloatingButtonProps {
    icon: React.ReactNode;
    onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}
export function FloatingButton({ icon, onClick }: FloatingButtonProps) {
    return (
        <ButtonUnstyled
            className="absolute right-2 top-2 h-9 w-9 cursor-pointer rounded-full p-xs opacity-0 transition-opacity duration-300 bg-iota-primary-30 group-hover:opacity-100 [&_svg]:h-5 [&_svg]:w-5 text-iota-neutral-100"
            onClick={onClick}
        >
            {icon}
        </ButtonUnstyled>
    );
}
