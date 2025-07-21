// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { ImageCard, ImageCardSize } from '@/components/ImageCard';

const WHY_IOTA_NAMES = [
    {
        title: 'Simplified, Safer Transactions',
        body: 'Replace long, error-prone hashes with names people can recognize and remember',
        image: '/landing-page/simplified-safer.png',
    },
    {
        title: 'Unlimited Subnames, Infinite Utility',
        body: 'Unlimited subnames let you set up custom tags like @wallet.yourname or @dev.yourname – ideal for services, roles, or communities',
        image: '/landing-page/unlimited-subnames.png',
    },
];

export function NameUtility() {
    return (
        <section>
            <div className="container py-14 md:py-20 items-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[33px]">
                    {WHY_IOTA_NAMES.map((data, index) => (
                        <ImageCard key={index} {...data} size={ImageCardSize.Large} />
                    ))}
                </div>
            </div>
        </section>
    );
}
