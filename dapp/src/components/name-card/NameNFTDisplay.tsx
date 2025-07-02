// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import cx from 'clsx';
import { useState } from 'react';

import { NAME_CARD_CLASSNAMES } from './classNames.constants';
import { NameCardDisplaySize } from './enums';
import { NameGradient } from './NameGradient';

export interface NameNftDisplayProps {
    name: string;
    subname?: string;
    expiration: Date;
    image?: string;
    header?: React.ReactNode;
    size?: NameCardDisplaySize;
}

export function NameNftDisplay({
    name,
    image,
    subname,
    expiration,
    header,
    size = NameCardDisplaySize.Medium,
}: NameNftDisplayProps) {
    const [showFallback, setShowFallback] = useState(false);

    return (
        <div className="w-full aspect-square rounded-xl relative">
            {header && (
                <div className="flex p-sm flex-row justify-between absolute top-0 left-0 w-full">
                    {header}
                </div>
            )}

            {image && !showFallback ? (
                <img
                    src={image}
                    alt={name}
                    onError={() => setShowFallback(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <NameGradient />

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="flex flex-col gap-xxs px-md py-xs">
                            {subname && (
                                <span
                                    className={cx(
                                        'peer subname text-center uppercase font-bold -tracking-[0.242px] leading-[100%] font-roboto-flex',
                                        NAME_CARD_CLASSNAMES.subname[size],
                                    )}
                                >
                                    {subname}
                                </span>
                            )}

                            <span
                                className={cx(
                                    'text-center uppercase text-names-neutral-100 font-bold -tracking-[0.483px] leading-[100%] font-roboto-flex',
                                    NAME_CARD_CLASSNAMES.name[size],
                                )}
                            >
                                @{name}
                            </span>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full flex flex-row justify-end px-md--rs py-sm--rs  font-roboto-flex">
                        <span className={cx(NAME_CARD_CLASSNAMES.expiration[size])}>
                            {expiration.toLocaleDateString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
