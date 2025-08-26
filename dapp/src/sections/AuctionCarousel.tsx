// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, ButtonSize, ButtonType } from '@iota/apps-ui-kit';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AuctionBidDialog, AuctionDetails } from '@/auctions';
import { AuctionPublicItem } from '@/auctions/components/AuctionPublicItem';
import { Carousel } from '@/components';
import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

interface AuctionCarouselProps {
    auctions: AuctionDetails[];
    isLoading?: boolean;
}

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

            <div className="relative">
                <div className="absolute top-0 left-0 w-[60px] h-full bg-gradient-to-r from-[#0b0c23] via-[#0b0c23cc] to-transparent pointer-events-none z-10"></div>
                <div className="absolute top-0 right-0 w-[60px] h-full bg-gradient-to-l from-[#0b0c23] via-[#0b0c23cc] to-transparent pointer-events-none z-10"></div>

                <Carousel
                    pauseOnHover
                    items={auctions}
                    renderItem={(item) => (
                        <AuctionPublicItem key={item.name} auction={item} onBidClick={onBidClick} />
                    )}
                ></Carousel>
            </div>

            {bidDialogName && (
                <AuctionBidDialog name={bidDialogName} closeDialog={() => setBidDialogName(null)} />
            )}
        </div>
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
