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
            className="h-9 w-9 rounded-full p-xs bg-iota-primary-30 hover:bg-opacity-80 transition-colors duration-150 [&_svg]:h-5 [&_svg]:w-5 text-iota-neutral-100"
            onClick={onClick}
        >
            {icon}
        </ButtonUnstyled>
    );
}
