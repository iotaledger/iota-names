// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import cx from 'clsx';
import { useState } from 'react';

import { SvgNamesLogo } from '../svgs/SvgNamesLogo';
import { CommonNameCardProps, NAME_CARD_CLASSNAMES, NameCardSize } from './helpers';
import { NameDisplayGradient, NameDisplayGradientExpired } from './nft-gradients';

export interface NameNftDisplayProps extends CommonNameCardProps {
    button?: React.ReactNode;
}

export function NameNftDisplay({
    name,
    image,
    subname,
    expiration,
    badge,
    button,
    size = NameCardSize.Medium,
}: NameNftDisplayProps) {
    const [showFallback, setShowFallback] = useState(false);

    const hasExpirationDate = !!expiration;
    const expirationDate = hasExpirationDate ? new Date(expiration) : undefined;

    const isExpired = expirationDate ? expirationDate < new Date() : undefined;

    const GradientComponent =
        hasExpirationDate && isExpired ? NameDisplayGradientExpired : NameDisplayGradient;

    return (
        <div
            className={cx(
                'flex flex-col relative aspect-square rounded-xl group/display z-0',
                NAME_CARD_CLASSNAMES.display[size],
            )}
        >
            {image && !showFallback ? (
                <img
                    src={image}
                    alt={name}
                    onError={() => setShowFallback(true)}
                    className="w-full h-full object-cover flex-1"
                />
            ) : (
                <div className="w-full h-full flex flex-col relative font-roboto-flex">
                    <GradientComponent className="absolute inset-0 w-full h-full -z-10" />

                    {badge && <div className="absolute top-sm left-sm">{badge}</div>}

                    {button && (
                        <div className="opacity-0 group-hover/display:opacity-100 transition-opacity absolute w-full top-0 right-0 px-sm py-sm bg-gradient-to-b from-black/80 to-transparent flex justify-end pointer-events-none">
                            <div className="shadow-xl pointer-events-auto">{button}</div>
                        </div>
                    )}

                    <div className="flex flex-col items-center justify-center w-full flex-1">
                        <div className="flex flex-col gap-xxs px-md py-xs">
                            {subname && (
                                <span
                                    className={cx(
                                        'peer subname text-center uppercase font-bold -tracking-[0.242px] leading-none',
                                        NAME_CARD_CLASSNAMES.subname[size],
                                    )}
                                >
                                    {subname}
                                </span>
                            )}

                            <span
                                className={cx(
                                    'text-center uppercase text-names-neutral-100 font-bold -tracking-[0.483px] leading-none',
                                    NAME_CARD_CLASSNAMES.name[size],
                                )}
                            >
                                @{name}
                            </span>
                        </div>
                    </div>

                    {expiration && (
                        <span
                            className={cx(
                                NAME_CARD_CLASSNAMES.expiration[size],
                                'absolute bottom-[20px] right-md--rs leading-none',
                            )}
                        >
                            {expirationDate?.toLocaleDateString()}
                        </span>
                    )}

                    <SvgNamesLogo className="absolute bottom-[20px] right-1/2 translate-x-1/2" />
                </div>
            )}
        </div>
    );
}
