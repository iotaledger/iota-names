// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    AuctionCarousel,
    BuiltForBuilders,
    FairAuction,
    LandingHero,
    NameUtility,
    WhyIotaNames,
} from '@/sections';
import { useActiveAuctionsCarousel } from '@/sections/useActiveAuctionsCarousel';

export default function Home() {
    const { data: auctions = [], isLoading } = useActiveAuctionsCarousel();

    return (
        <main className="flex flex-col min-h-screen">
            <LandingHero />
            <WhyIotaNames />
            <section className="container py-14 md:py-20">
                <AuctionCarousel auctions={auctions} isLoading={isLoading} />
            </section>
            <FairAuction />
            <NameUtility />
            <BuiltForBuilders />
        </main>
    );
}
