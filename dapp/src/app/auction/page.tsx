// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { FilterList, Search } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonSegment,
    ButtonSegmentType,
    ButtonType,
    Dropdown,
    Input,
    InputType,
    ListItem,
    SegmentedButton,
} from '@iota/apps-ui-kit';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AuctionBidDialog, AuctionDetails, isAuctionActive } from '@/auctions';
import { AuctionPublicItem } from '@/auctions/components/AuctionPublicItem';
import { useAuctions } from '@/auctions/hooks/useAuctions';
import { useDebounce } from '@/hooks/useDebounce';

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

        const active: AuctionDetails[] = [];
        const finished: AuctionDetails[] = [];

        auctions.forEach((auction) => {
            // Only include auctions that have metadata and are not loading
            if (!auction.isLoading && auction.metadata) {
                if (isAuctionActive(auction.metadata)) {
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
            <div className="mt-8 gap-lg w-full flex flex-row items-center flex-wrap">
                {displayedAuctions.map((auction) => (
                    <div key={auction.name} className="w-[220px]">
                        <AuctionPublicItem auction={auction} onBidClick={setBidDialogName} />
                    </div>
                ))}
            </div>

            {bidDialogName && (
                <AuctionBidDialog
                    name={bidDialogName}
                    closeDialog={() => setBidDialogName(null)}
                    onCompleted={() => {
                        setBidDialogName(null);
                    }}
                />
            )}
        </>
    );
}
