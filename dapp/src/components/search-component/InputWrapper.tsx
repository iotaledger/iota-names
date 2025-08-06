// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { SecondaryText } from '@iota/apps-ui-kit';
import cx from 'clsx';

export interface InputWrapperProps {
    label?: string;
    errorMessage?: string;
    disabled?: boolean;
}

export function InputWrapper({
    label,
    disabled,
    errorMessage,
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
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            {children}
            {errorMessage && (
                <div
                    className={cx(
                        'flex flex-row items-center',
                        errorMessage ? 'justify-between gap-md' : 'justify-end',
                    )}
                >
                    {errorMessage && <SecondaryText hasErrorStyles>{errorMessage}</SecondaryText>}
                </div>
            )}
        </div>
    );
}
