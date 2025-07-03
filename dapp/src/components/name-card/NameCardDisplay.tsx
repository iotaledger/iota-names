// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { nftDisplayVariants, NftDisplayVariants } from './variants';

interface NameCardDisplayProps {
    src: string;
    size?: NftDisplayVariants['size'];
    alt?: string;
    badge?: React.ReactNode;
    button?: React.ReactNode;
    onError?: () => void;
}
export function NameCardDisplay({
    src,
    alt,
    size,
    badge,
    button,
    onError,
    children,
}: React.PropsWithChildren<NameCardDisplayProps>) {
    return (
        <div className={nftDisplayVariants({ size })}>
            <div className="w-full h-full flex flex-col relative">
                {badge && <div className="absolute top-sm left-sm">{badge}</div>}

                {button && (
                    <div className="opacity-0 group-hover/display:opacity-100 transition-opacity absolute w-full top-0 right-0 px-sm py-sm bg-gradient-to-b from-black/80 to-transparent flex justify-end pointer-events-none">
                        <div className="shadow-xl pointer-events-auto">{button}</div>
                    </div>
                )}

                <img
                    className="absolute inset-0 w-full h-full -z-[1]"
                    src={src}
                    alt={alt}
                    onError={onError}
                />

                {children}
            </div>
        </div>
    );
}
