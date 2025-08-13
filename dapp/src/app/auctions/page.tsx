// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    ArrowLeft,
    ArrowRight,
    FilterList,
    Info,
    Loader,
    Search,
    Warning,
} from '@iota/apps-ui-icons';
import {
    Button,
    ButtonSegment,
    ButtonSegmentType,
    ButtonSize,
    ButtonType,
    Chip,
    ChipType,
    Dropdown,
    DropdownPosition,
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
import { useEffect, useRef, useState } from 'react';

import { AuctionBidDialog } from '@/auctions';
import { AuctionPublicItem } from '@/auctions/components/AuctionPublicItem';
import { useAuctions } from '@/auctions/hooks/useAuctions';
import { useDebounce } from '@/hooks/useDebounce';
import { getPaginationPages } from '@/lib/utils';

export type AuctionStatus = 'all' | 'active' | 'finished';

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
    const [selectedStatus, setSelectedStatus] = useState<AuctionStatus>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [areFiltersVisible, setAreFiltersVisible] = useState<boolean>(false);
    const [bidDialogName, setBidDialogName] = useState<string | null>(null);
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);
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

    useEffect(() => {
        setPage(0)
    }, [pageSize, sortOptions, searchQuery, selectedStatus])

    const {
        data: auctions,
        totalItems,
        isLoading,
        error: isAuctionsError,
    } = useAuctions({
        search: debouncedSearchQuery,
        status: selectedStatus,
        sort: sortOptions.sort,
        sortBy: sortOptions.sortBy,
        page,
        pageSize,
    });

    const typeOptions = [
        {
            label: 'All',
            value: 'all' as AuctionStatus,
        },
        {
            label: 'Active',
            value: 'active' as AuctionStatus,
        },
        {
            label: 'Finished',
            value: 'finished' as AuctionStatus,
        },
    ];

    const infoBox = (() => {
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

        if (auctions.length === 0) {
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
    })();

    const totalPages = Math.ceil(totalItems / pageSize);
    const paginationPages = getPaginationPages(page + 1, totalPages, 4);

    const defaultPage = 0;
    const paginationOptions: TablePaginationOptions = {
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
    };

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
                            selected={selectedStatus === option.value}
                            onClick={() => setSelectedStatus(option.value)}
                        />
                    ))}
                </SegmentedButton>

                <div className="md:flex hidden w-full max-w-[260px] gap-4" ref={dropdownRef}>
                    <div className="w-full max-w-2xl flex flex-col backdrop-blur-md bg-white/5 overflow-hidden [&_*]:!border-transparent rounded-full [&>div]:rounded-full [&_.input-container]:rounded-full">
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
                            {auctions.map((auction) => (
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
                <div className="flex justify-center items-center mt-8">
                    <div className="flex flex-1 justify-center">
                        <div className="flex gap-2">
                            <Button
                                type={ButtonType.Secondary}
                                size={ButtonSize.Small}
                                icon={<ArrowLeft />}
                                disabled={!paginationOptions.hasPrev}
                                onClick={paginationOptions.onPrev}
                            />
                        </div>
                        <div className="flex gap-2 mx-6">
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
                                        type={ChipType.Outline}
                                        selected={page === pageNumber - 1}
                                        onClick={() => setPage(pageNumber - 1)}
                                        label={pageNumber.toString()}
                                    />
                                );
                            })}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type={ButtonType.Secondary}
                                size={ButtonSize.Small}
                                icon={<ArrowRight />}
                                disabled={!paginationOptions.hasNext}
                                onClick={paginationOptions.onNext}
                            />
                        </div>
                    </div>
                    <div className="flex ml-6">
                        <Select
                            dropdownPosition={DropdownPosition.Top}
                            value={pageSize.toString()}
                            options={PAGE_SIZES_RANGE.map((size) => ({
                                label: `${size} / page`,
                                id: size.toString(),
                            }))}
                            size={SelectSize.Small}
                            onValueChange={(e) => {
                                setPageSize(Number(e));
                                paginationOptions.onFirst!();
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
