// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { FilterList, Info, Loader, Search, Warning } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonSegment,
    ButtonSegmentType,
    ButtonType,
    Chip,
    ChipType,
    Dropdown,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    Input,
    InputType,
    ListItem,
    SegmentedButton,
    Select,
    SelectSize,
    TablePaginationOptions,
} from '@iota/apps-ui-kit';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AuctionBidDialog, AuctionDetails, isAuctionActive } from '@/auctions';
import { AuctionPublicItem } from '@/auctions/components/AuctionPublicItem';
import { useAuctions } from '@/auctions/hooks/useAuctions';
import { useDebounce } from '@/hooks/useDebounce';
import { getPaginationPages } from '@/lib/utils';

enum TypeFilter {
    All = 'All',
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

const PAGE_SIZES_RANGE = [10, 20, 50, 100];

export default function AuctionsPage(): JSX.Element {
    const [selectedFilter, setSelectedFilter] = useState<TypeFilter>(TypeFilter.All);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [areFiltersVisible, setAreFiltersVisible] = useState<boolean>(false);
    const [bidDialogName, setBidDialogName] = useState<string | null>(null);
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(50);
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

    const {
        data: auctions,
        totalItems,
        isLoading,
        error: isAuctionsError,
    } = useAuctions({
        search: debouncedSearchQuery || undefined,
        sort: sortOptions.sort,
        sortBy: sortOptions.sortBy,
        page,
        pageSize,
    });

    const { allAuctions, activeAuctions, finishedAuctions } = useMemo(() => {
        if (!auctions) {
            return { allAuctions: [], activeAuctions: [], finishedAuctions: [] };
        }

        const allAuctions: AuctionDetails[] = [];
        const activeAuctions: AuctionDetails[] = [];
        const finishedAuctions: AuctionDetails[] = [];

        auctions.forEach((auction) => {
            // Only include auctions that have metadata and are not loading
            if (!auction.isLoading && auction.metadata) {
                allAuctions.push(auction);

                if (isAuctionActive(auction.metadata)) {
                    activeAuctions.push(auction);
                } else {
                    finishedAuctions.push(auction);
                }
            }
        });

        return { allAuctions, activeAuctions, finishedAuctions };
    }, [auctions]);

    const typeOptions = useMemo(() => {
        return [
            {
                label: TypeFilter.All,
                value: TypeFilter.All,
                disabled: false,
            },
            {
                label: TypeFilter.Active,
                value: TypeFilter.Active,
                disabled: activeAuctions.length === 0,
            },
            {
                label: TypeFilter.Finished,
                value: TypeFilter.Finished,
                disabled: finishedAuctions.length === 0,
            },
        ];
    }, [allAuctions, activeAuctions, finishedAuctions]);

    const infoBox = useMemo(() => {
        if (isLoading) {
            return null;
        }

        if (isAuctionsError) {
            return (
                <div className="flex">
                    <InfoBox
                        style={InfoBoxStyle.Elevated}
                        type={InfoBoxType.Error}
                        supportingText={'Failed to load auctions. Please try again later.'}
                        icon={<Warning />}
                    />
                </div>
            );
        }

        if (allAuctions.length === 0) {
            return (
                <div className="flex">
                    <InfoBox
                        style={InfoBoxStyle.Elevated}
                        type={InfoBoxType.Default}
                        supportingText={'There are no auctions available at the moment.'}
                        icon={<Info />}
                    />
                </div>
            );
        }
    }, [isLoading, isAuctionsError, allAuctions.length]);

    const displayedAuctions =
        selectedFilter === TypeFilter.All
            ? allAuctions
            : selectedFilter === TypeFilter.Active
              ? activeAuctions
              : finishedAuctions;

    const totalPages = Math.ceil(totalItems / pageSize);
    const paginationPages = getPaginationPages(page + 1, totalPages, 5);

    const paginationOptions: TablePaginationOptions = useMemo(() => {
        const defaultPage = 0;

        return {
            hasFirst: page > defaultPage,
            hasLast: page < totalItems / pageSize - 1,
            hasPrev: page > defaultPage,
            hasNext: page < totalItems / pageSize - 1,
            onFirst: () => {
                setPage(defaultPage);
            },
            onPrev: () => {
                const prevPage = page > defaultPage ? page - 1 : defaultPage;
                setPage(prevPage);
            },
            onNext: () => {
                const nextPage = page < totalItems / pageSize - 1 ? page + 1 : page;
                setPage(nextPage);
            },
            onLast: () => {
                const lastPage = -1;
                setPage(lastPage);
            },
        };
    }, [page, pageSize, totalItems]);

    return (
        <>
            <div className="flex flex-row gap-md items-center pt-[80px] md:pt-0">
                <h2 className="text-headline-md text-names-neutral-92 font-bold leading-[120%] -tracking-[0.4px]">
                    Auctions
                </h2>
            </div>
            <div className="flex justify-between relative">
                <SegmentedButton>
                    {typeOptions.map((option) => (
                        <ButtonSegment
                            key={option.value}
                            type={ButtonSegmentType.Rounded}
                            label={option.label}
                            selected={selectedFilter === option.value}
                            onClick={() => setSelectedFilter(option.value)}
                            disabled={option.disabled}
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
            <div className="flex flex-col flex-1 justify-between">
                <div>
                    {infoBox}
                    {isLoading ? (
                        <div className="flex w-full justify-center">
                            <Loader className="animate-spin" data-testid="loading-indicator" />
                        </div>
                    ) : (
                        <div className="mt-8 gap-lg w-full flex flex-row items-center flex-wrap">
                            {displayedAuctions.map((auction) => (
                                <div key={auction.name} className="w-[220px]">
                                    <AuctionPublicItem
                                        auction={auction}
                                        onBidClick={setBidDialogName}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center mt-8">
                    <div className="flex gap-2">
                        {paginationPages?.map((pageNumber, index) => {
                            if (pageNumber === '...') {
                                return (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="text-names-neutral-92"
                                    >
                                        {pageNumber}
                                    </span>
                                );
                            }

                            return (
                                <Chip
                                    key={`page-${pageNumber}`}
                                    type={ChipType.Elevated}
                                    selected={page === pageNumber - 1}
                                    onClick={() => setPage(pageNumber - 1)}
                                    label={pageNumber.toString()}
                                />
                            );
                        })}
                    </div>
                    <div className="flex">
                        <Select
                            value={pageSize.toString()}
                            options={PAGE_SIZES_RANGE.map((size) => ({
                                label: `${size} / page`,
                                id: size.toString(),
                            }))}
                            size={SelectSize.Small}
                            onValueChange={(e) => {
                                setPageSize(Number(e));
                                paginationOptions?.onFirst?.();
                            }}
                        />
                    </div>
                </div>
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
