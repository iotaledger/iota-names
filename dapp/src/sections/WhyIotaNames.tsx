// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { ImageCard } from '@/components/ImageCard';

const WHY_IOTA_NAMES = [
    {
        title: 'Establish Your Presence',
        body: 'Secure a company, product, or service name before someone else does - protect your namespace early',
        image: '/landing-page/establish-your-present.png',
    },
    {
        title: 'Own. Transfer. Build On.',
        body: 'Your IOTA Names is a true on-chain asset - own it, sell it or transfer it',
        image: '/landing-page/own-transfer.png',
    },
    {
        title: 'One Name, Everywhere',
        body: 'Send payments and interact across any wallet or dApp with a familiar @name, not 64-character hashes, just simple, seamless UX',
        image: '/landing-page/one-name.png',
    },
];

export function WhyIotaNames() {
    return (
        <section>
            <div className="-mt-40 md:-mt-20 pb-14 md:pb-20 container items-center">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
                    {WHY_IOTA_NAMES.map((data, index) => (
                        <ImageCard key={index} {...data} />
                    ))}
                </div>
            </div>
        </section>
    );
}
