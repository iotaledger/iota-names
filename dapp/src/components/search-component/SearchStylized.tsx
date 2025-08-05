// Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Close } from '@iota/apps-ui-icons';
import { ButtonUnstyled, SecondaryText } from '@iota/apps-ui-kit';
import cx from 'clsx';
import { forwardRef, useRef } from 'react';

import { InputWrapper } from './InputWrapper';

export const INPUT_CLASSES =
    'w-full input-caret-color bg-transparent text-body-lg caret-input-caret-color focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed';
export const INPUT_TEXT_CLASSES = 'input-text-color';
export const INPUT_PLACEHOLDER_CLASSES = 'input-placeholder-color';
export const INPUT_NUMBER_CLASSES =
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed';
export const BORDER_CLASSES =
    'px-md py-sm rounded-lg border input-border-color input-border-color-disabled group-[.enabled]:cursor-text input-border-error-color hover:group-[.enabled]:input-border-color-hover input-border-color-focus';

export enum LabelHtmlTag {
    Label = 'label',
    Div = 'div',
}

export interface InputWrapperProps {
    /**
     * Shows a label with the text above the input.
     */
    label?: string;
    /**
     * Shows a caption with the text below the input.
     */
    caption?: string;
    /**
     * Error Message. Overrides the caption.
     */
    errorMessage?: string;
    /**
     * Amount counter that is shown at the side of the caption text.
     */
    amountCounter?: string | number;
    /**
     * Is the input required
     */
    required?: boolean;
    /**
     * Is the input disabled
     */
    disabled?: boolean;
    /**
     * Use a div as a label instead of a label element
     */
    labelHtmlTag?: LabelHtmlTag;
}

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

    const showClearInput = Boolean(value && onClearInput);

    return (
        <InputWrapper
            label={label}
            caption={caption}
            disabled={disabled}
            errorMessage={errorMessage}
            amountCounter={amountCounter}
            required={inputProps.required}
        >
            <div
                className={cx(
                    'input-container relative flex flex-row items-center gap-x-3',
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
                        <span className="text-label-md text-iota-neutral-60 dark:text-iota-neutral-40">
                            {supportingValue}
                        </span>
                    )}
                </div>

                {supportingText && <SecondaryText>{supportingText}</SecondaryText>}

                {showClearInput ? (
                    <ButtonUnstyled
                        className="input-icon-color [&_svg]:h-5 [&_svg]:w-5"
                        onClick={onClearInput}
                        tabIndex={-1}
                    >
                        <Close />
                    </ButtonUnstyled>
                ) : (
                    trailingElement
                )}
            </div>
        </InputWrapper>
    );
});
