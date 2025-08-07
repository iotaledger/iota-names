// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    ArrowLeft,
    ArrowRight,
    DoubleArrowLeft,
    DoubleArrowRight,
    FilterList,
    Search,
} from '@iota/apps-ui-icons';
import {
    Button,
    ButtonSegment,
    ButtonSegmentType,
    ButtonSize,
    ButtonType,
    Dropdown,
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

    const { data: auctions, totalItems } = useAuctions({
        search: debouncedSearchQuery || undefined,
        sort: sortOptions.sort,
        sortBy: sortOptions.sortBy,
        page,
        pageSize,
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
    }, []);

    const displayedAuctions =
        selectedFilter === TypeFilter.Active ? activeAuctions : finishedAuctions;

    const paginationOptions: TablePaginationOptions = useMemo(() => {
        const defaultPage = 0;

        return {
            hasFirst: page > defaultPage,
            hasLast: page < totalItems / pageSize,
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
                const lastPage = Math.ceil(totalItems / pageSize) - 1;
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
            <div className="mt-8 gap-lg w-full flex flex-row items-center flex-wrap">
                {displayedAuctions.map((auction) => (
                    <div key={auction.name} className="w-[220px]">
                        <AuctionPublicItem auction={auction} onBidClick={setBidDialogName} />
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-8">
                <div className="flex gap-2">
                    {paginationOptions && (
                        <>
                            <Button
                                type={ButtonType.Secondary}
                                size={ButtonSize.Small}
                                icon={<DoubleArrowLeft />}
                                disabled={!paginationOptions.hasFirst}
                                onClick={paginationOptions.onFirst}
                            />
                            <Button
                                type={ButtonType.Secondary}
                                size={ButtonSize.Small}
                                icon={<ArrowLeft />}
                                disabled={!paginationOptions.hasPrev}
                                onClick={paginationOptions.onPrev}
                            />
                            <Button
                                type={ButtonType.Secondary}
                                size={ButtonSize.Small}
                                icon={<ArrowRight />}
                                disabled={!paginationOptions.hasNext}
                                onClick={paginationOptions.onNext}
                            />
                            <Button
                                type={ButtonType.Secondary}
                                size={ButtonSize.Small}
                                icon={<DoubleArrowRight />}
                                disabled={!paginationOptions.hasLast}
                                onClick={paginationOptions.onLast}
                            />
                        </>
                    )}
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
