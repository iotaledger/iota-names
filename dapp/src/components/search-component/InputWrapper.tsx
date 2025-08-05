// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { SecondaryText } from '@iota/apps-ui-kit';
import cx from 'clsx';
import { createElement } from 'react';

export const LABEL_CLASSES = 'flex flex-col gap-y-2 text-headline-md text-names-neutral-92';

export enum LabelHtmlTag {
    Label = 'label',
    Div = 'div',
}

export interface InputWrapperProps {
    label?: string;
    caption?: string;
    errorMessage?: string;
    disabled?: boolean;
    labelHtmlTag?: LabelHtmlTag;
}

export function InputWrapper({
    label,
    caption,
    disabled,
    errorMessage,
    labelHtmlTag = LabelHtmlTag.Label,
    children,
}: React.PropsWithChildren<InputWrapperProps>) {
    return (
        <div
            className={cx('group flex w-full flex-col gap-y-2', {
                'cursor-not-allowed opacity-40': disabled,
                errored: errorMessage,
                enabled: !disabled,
            })}
        >
            {label ? (
                <LabelWrapper labelHtmlTag={labelHtmlTag}>
                    {label}
                    {children}
                </LabelWrapper>
            ) : (
                children
            )}

            {(errorMessage || caption) && (
                <div
                    className={cx(
                        'flex flex-row items-center',
                        caption || errorMessage ? 'justify-between gap-md' : 'justify-end',
                    )}
                >
                    {(errorMessage || caption) && (
                        <SecondaryText hasErrorStyles>{errorMessage || caption}</SecondaryText>
                    )}
                </div>
            )}
        </div>
    );
}

function LabelWrapper({
    labelHtmlTag,
    children,
}: Required<Pick<InputWrapperProps, 'labelHtmlTag'>> & {
    children: React.ReactNode;
}) {
    return createElement(labelHtmlTag, { className: LABEL_CLASSES }, children);
}
