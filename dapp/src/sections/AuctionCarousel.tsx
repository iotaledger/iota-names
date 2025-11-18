// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, ButtonSize, ButtonType } from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useAuctions } from '@/auctions';

import 'swiper/css';
import 'swiper/css/pagination';

import { AuctionBidDialog } from '@/auctions';
import { AuctionPublicItem } from '@/auctions/components/AuctionPublicItem';
import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

export function AuctionCarousel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [bidDialogName, setBidDialogName] = useState<string | null>(null);
    const account = useCurrentAccount();

    const [containerWidth, setContainerWidth] = useState(0);
    const [hasMeasured, setHasMeasured] = useState(false);

    const { data: auctions = [], isLoading } = useAuctions({
        userAddress: account?.address,
        status: 'active',
        search: '',
        page: 0,
        pageSize: 20,
        sortBy: 'bid',
        sort: 'desc',
    });

    const isPreparing = isLoading || !hasMeasured || !containerWidth;
    const hasAuctions = !isLoading && auctions.length > 0;
    const canRender = !isPreparing && hasAuctions;

    const onBidClick = useCallback((name: string) => {
        setBidDialogName(name);
    }, []);

    const slidesPerView = (() => {
        if (!canRender) return 0;

        const AUCTION_WIDTH = 220;
        const GAP = 16;

        return containerWidth / (AUCTION_WIDTH + GAP);
    })();

    const auctionsToRender = (() => {
        if (!canRender) return [];

        const MIN_ITEMS = 10;
        if (auctions.length < MIN_ITEMS) {
            return Array.from({ length: MIN_ITEMS }).map((_, i) => {
                const newItem = auctions[i % auctions.length];
                const key = `${newItem.name}__${i}`;
                return { ...newItem, key };
            });
        }

        return auctions.map((auction) => ({ ...auction, key: auction.name }));
    })();

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? el.offsetWidth;
            setContainerWidth(w);
            if (!hasMeasured) setHasMeasured(true);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [hasMeasured]);

    return (
        <section className="container py-14 md:py-20" ref={containerRef}>
            <div className="w-full">
                <AuctionCarouselHeader />

                {isPreparing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="bg-names-neutral-12 rounded-lg h-64"></div>
                            </div>
                        ))}
                    </div>
                ) : !hasAuctions ? (
                    <div className="text-center py-12">
                        <p className="text-body-lg text-names-neutral-70">
                            No active auctions at the moment
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute top-0 left-0 w-[60px] h-full bg-gradient-to-r from-[#0b0c23] via-[#0b0c23cc] to-transparent pointer-events-none z-10"></div>
                        <div className="absolute top-0 right-0 w-[60px] h-full bg-gradient-to-l from-[#0b0c23] via-[#0b0c23cc] to-transparent pointer-events-none z-10"></div>

                        {/* Carousel with autoplay that pauses on hover and when tab is not visible */}
                        {/* <Carousel autoPlay pauseOnHover items={auctions} renderItem={renderItem} /> */}

                        <Swiper
                            slidesPerView={slidesPerView}
                            autoplay={{
                                // disableOnInteraction: true,
                                delay: 2500,
                                waitForTransition: true,
                                pauseOnMouseEnter: true,
                            }}
                            centeredSlides
                            loop
                            className="mySwiper"
                            modules={[Autoplay]}
                            data-testid="auction-carousel"
                        >
                            {auctionsToRender.map((auction) => (
                                <SwiperSlide key={auction.key} className="pb-xs">
                                    <div className="flex justify-center">
                                        <div className="w-[220px]">
                                            <AuctionPublicItem
                                                auction={auction}
                                                onBidClick={onBidClick}
                                            />
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}

                {bidDialogName && (
                    <AuctionBidDialog
                        name={bidDialogName}
                        closeDialog={() => setBidDialogName(null)}
                    />
                )}
            </div>
        </section>
    );
}

function AuctionCarouselHeader() {
    const router = useRouter();
    const { open, close } = useAvailabilityCheckDialog();

    const handleViewAll = useCallback(() => {
        router.push('/auctions');
    }, [router]);

    return (
        <>
            <h2 className="text-headline-lg text-names-primary-100 mb-4 text-center">
                Live Auctions
            </h2>
            <div className="flex items-center justify-center mb-8">
                <div className="flex gap-2">
                    <Button
                        text="Start Auction"
                        type={ButtonType.Outlined}
                        size={ButtonSize.Medium}
                        onClick={() => open({ autoFocusInput: true, onCompleted: close })}
                    />
                    <Button
                        text="View All"
                        type={ButtonType.Outlined}
                        size={ButtonSize.Medium}
                        onClick={handleViewAll}
                    />
                </div>
            </div>
        </>
    );
}
