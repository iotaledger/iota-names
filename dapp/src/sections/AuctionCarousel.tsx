// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, ButtonSize, ButtonType } from '@iota/apps-ui-kit';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import Carousel from 'react-multi-carousel';

import 'react-multi-carousel/lib/styles.css';

import { AuctionBidDialog, AuctionDetails } from '@/auctions';
import { AuctionPublicItem } from '@/auctions/components/AuctionPublicItem';

interface AuctionCarouselProps {
    auctions: AuctionDetails[];
    isLoading?: boolean;
}

// Responsive breakpoints for the carousel
const responsive = {
    desktop: {
        breakpoint: { max: 3000, min: 1024 },
        items: 4,
        slidesToSlide: 1,
    },
    tablet: {
        breakpoint: { max: 1024, min: 768 },
        items: 2,
        slidesToSlide: 1,
    },
    mobile: {
        breakpoint: { max: 768, min: 0 },
        items: 1,
        slidesToSlide: 1,
    },
};

export function AuctionCarousel({ auctions, isLoading }: AuctionCarouselProps) {
    const [bidDialogName, setBidDialogName] = useState<string | null>(null);

    const onBidClick = useCallback((name: string) => {
        setBidDialogName(name);
    }, []);

    if (isLoading) {
        return (
            <div className="w-full">
                <AuctionCarouselHeader />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="bg-names-neutral-12 rounded-lg h-64"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!auctions.length) {
        return (
            <div className="w-full">
                <AuctionCarouselHeader />
                <div className="text-center py-12">
                    <p className="text-body-lg text-names-neutral-70">
                        No active auctions at the moment
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <AuctionCarouselHeader />

            <style jsx global>{`
                .react-multi-carousel-track {
                    gap: 1rem;
                }
                .react-multi-carousel-item {
                    padding: 0;
                }
                .react-multi-carousel-dot-list {
                    display: none !important;
                }
                .react-multiple-carousel__arrow {
                    display: none !important;
                }
                .auction-carousel-container {
                    position: relative;
                }
            `}</style>

            <div className="relative">
                <div className="absolute top-0 left-0 w-[60px] md:w-[120px] lg:w-[150px] h-full bg-gradient-to-r from-[#0b0c23] via-[#0b0c23cc] to-transparent pointer-events-none z-10"></div>
                <div className="absolute top-0 right-0 w-[60px] md:w-[120px] lg:w-[150px] h-full bg-gradient-to-l from-[#0b0c23] via-[#0b0c23cc] to-transparent pointer-events-none z-10"></div>

                <Carousel
                    responsive={responsive}
                    infinite={true}
                    autoPlay={true}
                    autoPlaySpeed={3000}
                    keyBoardControl={false}
                    showDots={false}
                    arrows={false}
                    slidesToSlide={1}
                    containerClass="auction-carousel-container"
                    itemClass="auction-carousel-item"
                    customTransition="transform 500ms ease-in-out"
                    transitionDuration={500}
                >
                    {auctions.map((auction) => (
                        <div key={auction.name} className="px-2">
                            <AuctionPublicItem auction={auction} onBidClick={onBidClick} />
                        </div>
                    ))}
                </Carousel>
            </div>

            {bidDialogName && (
                <AuctionBidDialog name={bidDialogName} closeDialog={() => setBidDialogName(null)} />
            )}
        </div>
    );
}

function AuctionCarouselHeader() {
    const router = useRouter();

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
                        onClick={handleViewAll}
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
