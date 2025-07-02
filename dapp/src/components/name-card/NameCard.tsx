// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { NameNftDisplay, type NameNftDisplayProps } from './NameNFTDisplay';

interface NameCardProps extends NameNftDisplayProps {
    header?: React.ReactNode;
}

export function NameCard({
    name,
    subname,
    image,
    expiration,
    header,
    children,
}: React.PropsWithChildren<NameCardProps>) {
    return (
        <div className="relative group/name-card rounded-xl overflow-hidden shadow-md bg-names-neutral-6">
            <NameNftDisplay
                name={name}
                subname={subname}
                expiration={expiration}
                image={image}
                header={header}
            />

            {children}
        </div>
    );
}
