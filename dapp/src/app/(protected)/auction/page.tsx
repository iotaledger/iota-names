// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Clock, FilterList, IotaLogoSmall, Search } from '@iota/apps-ui-icons';
import {
    // Badge,
    // BadgeType,
    Button,
    ButtonSegment,
    ButtonSegmentType,
    ButtonType,
    Divider,
    DividerType,
    Dropdown,
    Input,
    InputType,
    ListItem,
    // InfoBox,
    // InfoBoxStyle,
    // InfoBoxType,
    // LoadingIndicator,
    SegmentedButton,
} from '@iota/apps-ui-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
// import { formatBalance } from '@iota/iota-sdk/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
    AuctionBidDialog,
    AuctionDetails,
    formatTimeRemaining,
    getTimeRemaining,
    // useGetUserAuctions,
    // useGetUserAuctions
} from '@/auctions';
import { useAuctions } from '@/auctions/hooks/useAuctions';
import { useCountdown } from '@/auctions/hooks/useCountdown';
import { NameCard } from '@/components/name-card/NameCard';
import { NameCardBody } from '@/components/name-card/NameCardBody';
import { useDebounce } from '@/hooks/useDebounce';
import { formatNanosToIota } from '@/lib/utils';

// import { AuctionItem } from '@/auctions/components/AuctionItem';
// import { SearchInput } from '@/components/layout/SearchInput';
// import { AvatarDisplay } from '@/components/name-record/AvatarDisplay';

enum TypeFilter {
    Active = 'Active',
    Finished = 'Finished',
}

const SORT_OPTIONS = [
    {
        label: 'Bid: low to high',
        sort: 'asc' as const,
        sortBy: 'bid' as const,
    },
    {
        label: 'Bid: high to low',
        sort: 'desc' as const,
        sortBy: 'bid' as const,
    },
    {
        label: 'Name: A-Z',
        sort: 'asc' as const,
        sortBy: 'name' as const,
    },
    {
        label: 'Name: Z-A',
        sort: 'desc' as const,
        sortBy: 'name' as const,
    },
];

export default function AuctionsPage(): JSX.Element {
    const [selectedFilter, setSelectedFilter] = useState<TypeFilter>(TypeFilter.Active);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [areFiltersVisible, setAreFiltersVisible] = useState<boolean>(false);
    const [bidDialogName, setBidDialogName] = useState<string | null>(null);
    const [sortOptions, setSortOptions] = useState<{
        sort: 'asc' | 'desc';
        sortBy: 'bid' | 'name';
    }>({
        sort: 'asc',
        sortBy: 'bid',
    });

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setAreFiltersVisible(false);
            }
        }

        if (areFiltersVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [areFiltersVisible]);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const { data: auctions } = useAuctions({
        search: debouncedSearchQuery || undefined,
        sort: sortOptions.sort,
        sortBy: sortOptions.sortBy,
    });

    // Split auctions into active and finished - only include auctions with metadata
    const { activeAuctions, finishedAuctions } = useMemo(() => {
        if (!auctions) {
            return { activeAuctions: [], finishedAuctions: [] };
        }

        const now = Date.now();
        const active: AuctionDetails[] = [];
        const finished: AuctionDetails[] = [];

        auctions.forEach((auction) => {
            // Only include auctions that have metadata and are not loading
            if (!auction.isLoading && auction.metadata) {
                const endTime = auction.metadata.endTimestamp.getTime();
                if (endTime > now) {
                    active.push(auction);
                } else {
                    finished.push(auction);
                }
            }
        });

        return { activeAuctions: active, finishedAuctions: finished };
    }, [auctions]);

    const displayedAuctions =
        selectedFilter === TypeFilter.Active ? activeAuctions : finishedAuctions;

    console.log('auctions', auctions);
    console.log('active auctions', activeAuctions);
    console.log('finished auctions', finishedAuctions);

    return (
        <>
            <div className="flex flex-row gap-md items-center pt-[80px] md:pt-0">
                <h2 className="text-headline-md text-names-neutral-92 font-bold leading-[120%] -tracking-[0.4px]">
                    Auctions
                </h2>
            </div>
            <div className="flex justify-between relative">
                <SegmentedButton>
                    {Object.entries(TypeFilter).map(([key, value]) => (
                        <ButtonSegment
                            key={key}
                            type={ButtonSegmentType.Rounded}
                            label={value}
                            selected={selectedFilter === value}
                            onClick={() => setSelectedFilter(value)}
                        />
                    ))}
                </SegmentedButton>

                <div className="md:flex hidden w-full max-w-[260px] gap-4" ref={dropdownRef}>
                    <div className="w-full max-w-2xl flex flex-col backdrop-blur-md bg-white/5 overflow-hidden [&_*]:!border-none rounded-full">
                        <Input
                            placeholder="Search auction"
                            type={InputType.Text}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            trailingElement={<Search className="text-names-neutral-92 w-6 h-6" />}
                        />
                    </div>
                    <Button
                        type={ButtonType.Secondary}
                        icon={<FilterList className="text-names-neutral-92 w-6 h-6" />}
                        onClick={() => setAreFiltersVisible(!areFiltersVisible)}
                    />
                    {areFiltersVisible && (
                        <div className="absolute right-12 top-0 z-10">
                            <Dropdown>
                                {SORT_OPTIONS.map((option) => (
                                    <ListItem
                                        key={`${option.sort}-${option.sortBy}`}
                                        onClick={() =>
                                            setSortOptions({
                                                sort: option.sort,
                                                sortBy: option.sortBy,
                                            })
                                        }
                                        hideBottomBorder
                                        isHighlighted={
                                            sortOptions.sort === option.sort &&
                                            sortOptions.sortBy === option.sortBy
                                        }
                                    >
                                        <span>{option.label}</span>
                                    </ListItem>
                                ))}
                            </Dropdown>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-8 flex flex-wrap">
                {displayedAuctions.map((auction) => (
                    <div key={auction.name} className="w-1/3 md:w-1/4 p-2">
                        <NameCard name={auction.name} size="full">
                            <NameCardBody name={normalizeIotaName(auction.name)}>
                                <AuctionBidPrice
                                    price={auction.metadata?.currentBidNanos}
                                    auctionName={auction.name}
                                    onBidClick={setBidDialogName}
                                />
                                <div className="my-4">
                                    <Divider type={DividerType.Horizontal} />
                                </div>
                                <AuctionTimeRemaining auction={auction} />
                            </NameCardBody>
                        </NameCard>
                    </div>
                ))}
            </div>

            {/* Bid Dialog */}
            {bidDialogName && (
                <AuctionBidDialog
                    name={bidDialogName}
                    closeDialog={() => setBidDialogName(null)}
                    onCompleted={() => {
                        setBidDialogName(null);
                        // Optionally refresh auctions data
                    }}
                />
            )}
        </>
    );
}

function AuctionBidPrice({
    price,
    auctionName,
    onBidClick,
}: {
    price?: bigint;
    auctionName: string;
    onBidClick: (name: string) => void;
}): JSX.Element {
    const formattedPrice = formatNanosToIota(price ?? BigInt(0));

    return (
        <div className="flex items-center justify-between">
            <div>
                <div className="text-label-md text-names-neutral-50">Current Bid</div>
                <div className="flex mt-1 items-center gap-2">
                    <div className="bg-names-solid-blue rounded-full w-5 h-5 flex items-center justify-center">
                        <IotaLogoSmall className="w-4 h-4" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-body-lg">{formattedPrice}</span>
                        {/* <span className="text-label-md text-names-neutral-70">
                            ${convertedToFiat.toString()}
                        </span> */}
                    </div>
                </div>
            </div>
            <div>
                <Button
                    text="Bid"
                    onClick={() => onBidClick(auctionName)}
                    fullWidth
                    type={ButtonType.Outlined}
                />
            </div>
        </div>
    );
}

function AuctionTimeRemaining({ auction }: { auction: AuctionDetails }) {
    // Always call hooks at the top level - never inside conditions
    const timeRemainingMs = getTimeRemaining(auction.metadata);
    const { milliseconds } = useCountdown(timeRemainingMs);
    const formattedTimeRemaining = formatTimeRemaining(milliseconds);

    return (
        <div className="flex items-center justify-between">
            <div>
                <span className="text-label-md text-names-neutral-50">Time left</span>
            </div>
            <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-names-neutral-50" />
                <span className="text-label-md text-names-neutral-50">
                    {formattedTimeRemaining}
                </span>
            </div>
        </div>
    );
}
