// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useAuctions } from '@/auctions';
import {
    AuctionCarousel,
    BuiltForBuilders,
    FairAuction,
    LandingHero,
    NameUtility,
    WhyIotaNames,
} from '@/sections';

export default function Home() {
    const { data: auctions = [], isLoading } = useAuctions({
        status: 'active',
        search: '',
        page: 0,
        pageSize: 20,
        sortBy: 'bid',
        sort: 'desc',
    });

    return (
        <main className="flex flex-col min-h-screen">
            <LandingHero />
            <WhyIotaNames />
            <FairAuction />
            <section className="container py-14 md:py-20">
                <AuctionCarousel auctions={auctions} isLoading={isLoading} />
            </section>
            <NameUtility />
            <BuiltForBuilders />
        </main>
    );
}
