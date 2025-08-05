// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Close } from '@iota/apps-ui-icons';
import { ButtonUnstyled, SecondaryText } from '@iota/apps-ui-kit';
import cx, { clsx } from 'clsx';
import { forwardRef, useRef } from 'react';

import { InputWrapper, InputWrapperProps } from './InputWrapper';

export const INPUT_CLASSES =
    'w-full input-caret-color bg-transparent text-headline-md text-names-neutral-92 caret-input-caret-color focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed';
export const INPUT_TEXT_CLASSES = 'input-text-color';
export const INPUT_PLACEHOLDER_CLASSES = 'input-placeholder-color';
export const BORDER_CLASSES =
    'px-lg py-md rounded-full border-2 border-names-neutral-20 input-border-color-disabled group-[.enabled]:cursor-text input-border-error-color hover:group-[.enabled]:input-border-color-hover input-border-color-focus';

export interface BaseInputProps extends InputWrapperProps {
    leadingIcon?: React.ReactNode;
    supportingText?: string;
    amountCounter?: string | number;
    trailingElement?: React.ReactNode;
    value?: string;
    supportingValue?: string | null;
    defaultValue?: string;
    onClearInput?: () => void;
}

export type InputProps = BaseInputProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const SearchStylized = forwardRef<HTMLInputElement, InputProps>(function InputComponent(
    {
        label,
        caption,
        disabled,
        errorMessage,
        leadingIcon,
        supportingText,
        amountCounter,
        trailingElement,
        value,
        supportingValue,
        defaultValue,
        onClearInput,
        ...inputProps
    },
    forwardRef,
) {
    const inputWrapperRef = useRef<HTMLDivElement | null>(null);

    function focusOnInput() {
        inputWrapperRef.current?.querySelector('input')?.focus();
    }

    return (
        <InputWrapper
            label={label}
            caption={caption}
            disabled={disabled}
            errorMessage={errorMessage}
        >
            <div
                className={cx(
                    'search-container relative flex flex-row items-center gap-x-3 ',
                    BORDER_CLASSES,
                )}
                onClick={focusOnInput}
                ref={inputWrapperRef}
            >
                {leadingIcon && <span className="input-icon-color">{leadingIcon}</span>}
                <div className="flex flex-1 flex-col items-start">
                    <input
                        ref={forwardRef}
                        type="text"
                        value={value}
                        defaultValue={defaultValue}
                        disabled={disabled}
                        className={cx(INPUT_CLASSES, INPUT_TEXT_CLASSES, INPUT_PLACEHOLDER_CLASSES)}
                        {...inputProps}
                    />
                    {supportingValue && (
                        <span className="text-names-neutral-40">{supportingValue}</span>
                    )}
                </div>

                {supportingText && <SecondaryText>{supportingText}</SecondaryText>}

                <ButtonUnstyled
                    className={clsx(
                        'input-icon-color [&_svg]:h-5 [&_svg]:w-5 p-sm state-layer relative',
                        !value?.length && 'invisible',
                    )}
                    onClick={onClearInput}
                    tabIndex={-1}
                >
                    <Close />
                </ButtonUnstyled>

                {trailingElement}
            </div>
        </InputWrapper>
    );
});
