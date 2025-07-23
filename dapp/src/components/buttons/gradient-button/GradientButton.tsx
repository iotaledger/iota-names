// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import clsx from 'clsx';

import { PADDINGS, PADDINGS_ONLY_ICON, TEXT_CLASSES } from './button.classes';
import { ButtonHtmlType, ButtonSize } from './button.enums';

export interface GradientButtonProps {
    size?: ButtonSize;
    text?: string;
    icon?: React.ReactNode;
    iconAfterText?: boolean;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    fullWidth?: boolean;
    htmlType?: ButtonHtmlType;
    tabIndex?: number;
    testId?: string;
}

export function GradientButton({
    icon,
    text,
    disabled,
    onClick,
    fullWidth,
    htmlType = ButtonHtmlType.Button,
    size = ButtonSize.Medium,
    iconAfterText = false,
    tabIndex = 0,
    testId,
}: GradientButtonProps): React.JSX.Element {
    const paddingClasses = icon && !text ? PADDINGS_ONLY_ICON[size] : PADDINGS[size];
    const textSizes = TEXT_CLASSES[size];

    return (
        <button
            onClick={onClick}
            type={htmlType}
            className={clsx(
                'relative flex items-center justify-center rounded-full transition-all duration-150 ease-in p-[1px]',
                'bg-names-gradient-primary',
                'disabled:cursor-not-allowed disabled:opacity-40',
                fullWidth && 'w-full',
            )}
            disabled={disabled}
            tabIndex={tabIndex}
            data-testid={testId}
        >
            <div
                className={clsx(
                    'flex items-center justify-center rounded-full bg-names-neutral-4 gap-xs',
                    paddingClasses,
                    !iconAfterText ? 'flex-row' : 'flex-row-reverse',
                    !disabled ? 'state-layer' : '',
                )}
            >
                {icon && <span className="text-names-neutral-90">{icon}</span>}
                {text && (
                    <span className={clsx('font-inter text-names-neutral-90', textSizes)}>
                        {text}
                    </span>
                )}
            </div>
        </button>
    );
}
