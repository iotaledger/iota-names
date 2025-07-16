// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Search } from '@iota/apps-ui-icons';
import { Input, InputType } from '@iota/apps-ui-kit';

interface SearchInputProps {
    isBelowMd?: boolean;
    onFocus: () => void;
}
export function SearchInput({ isBelowMd = false, onFocus }: SearchInputProps) {
    const wrapperClass = isBelowMd
        ? 'md:flex hidden w-full max-w-[360px] justify-center mx-auto'
        : 'flex md:hidden w-full justify-center mx-auto';

    const containerClass =
        'w-full max-w-2xl flex flex-col backdrop-blur-md bg-white/5 overflow-hidden [&_*]:!border-none rounded-full';

    return (
        <div className={wrapperClass}>
            <div className={containerClass}>
                <Input
                    placeholder="Search for your IOTA name"
                    type={InputType.Text}
                    onFocus={onFocus}
                    trailingElement={<Search className="text-names-neutral-92 w-6 h-6" />}
                />
            </div>
        </div>
    );
}
