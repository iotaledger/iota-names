// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useState } from 'react';

import { AuctionBidDialog, AuctionDetails, AuctionItem } from '@/auctions';

interface ExtendedNameCardProps {
    name: string;
    auctionDetails: AuctionDetails;
}

export function ExtendedAuctionCard({ name, auctionDetails }: ExtendedNameCardProps) {
    const [showBidDialog, setShowBidDialog] = useState<boolean>(false);

    return (
        <>
            <AuctionItem auction={auctionDetails} onBidClick={() => setShowBidDialog(true)} />

            {showBidDialog && (
                <AuctionBidDialog
                    name={name}
                    closeDialog={() => {
                        setShowBidDialog(false);
                    }}
                />
            )}
        </>
    );
}
