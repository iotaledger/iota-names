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

export default function Home() {
    return (
        <main className="flex flex-col min-h-screen">
            <LandingHero />
            <WhyIotaNames />
            <FairAuction />
            <AuctionCarousel />
            <NameUtility />
            <BuiltForBuilders />
        </main>
    );
}
