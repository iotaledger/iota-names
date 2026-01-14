// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Activity, Clock, RecognizedBadge } from '@iota/apps-ui-icons';
import Lottie from 'lottie-react';

import fairAuctionAnimation from '@/animations/landing/fair-auction_bg_v1.json';
import { CircleGradient } from '@/components/CircleGradient';
import { IconCard } from '@/components/IconCard';

const TITTLE = 'Fair Auction, Real Users';
const BODY =
    'Each name starts in an open, on-chain bidding process, securing proper names for real users, not bots';

const FAIR_AUCTION = [
    {
        title: '1. Start the Clock',
        body: 'The first bid triggers a 2-day countdown',
        icon: <Clock />,
    },
    {
        title: '2. Beat the Buzzer',
        body: 'A bid in the closing 10 minutes adds 10 additional to the clock, giving everyone a fair shot',
        icon: <Activity />,
    },
    {
        title: '3. Claim & Go',
        body: 'Once settled, the name is yours to use across the ecosystem',
        icon: <RecognizedBadge />,
    },
];

export function FairAuction() {
    return (
        <section className="relative overflow-hidden">
            <div className="container py-14 md:py-20">
                <div className="bg-names-neutral-6 rounded-3xl py-lg md:py-[40px] px-xl md:px-2xl relative">
                    <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden rounded-3xl">
                        <div className="h-full w-full ">
                            <Lottie
                                animationData={fairAuctionAnimation}
                                loop={true}
                                autoplay={true}
                                style={{
                                    height: '100%',
                                }}
                                rendererSettings={{
                                    preserveAspectRatio: 'xMidYMid slice',
                                }}
                            />
                        </div>
                    </div>
                    <CircleGradient position="top-left" />
                    <div className="flex flex-col md:flex-row gap-6 md:gap-[72px] items-center md:items-start relative">
                        <div className="flex flex-col justify-center gap-xl md:gap-2xl flex-1">
                            <div className="flex flex-col gap-xs">
                                <h2 className="text-headline-lg text-names-primary-100">
                                    {TITTLE}
                                </h2>
                                <p className="text-body-lg text-names-neutral-70 w-full md:max-w-[428px]">
                                    {BODY}
                                </p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-lg">
                                {FAIR_AUCTION.map((data, index) => (
                                    <IconCard key={index} {...data} />
                                ))}
                            </div>
                        </div>
                        <img width={360} src="/landing-page/iota-news.png" />
                    </div>
                </div>
            </div>
        </section>
    );
}
