// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuctionDetails } from '@/auctions';

// Helper type for the render function
type ItemRenderer<T> = (item: T) => React.ReactNode;

// Memoized item wrapper to prevent re-render when item/index unchanged
const CarouselItem = React.memo(
    function CarouselItem({
        item,
        renderItem,
    }: {
        item: AuctionDetails;
        renderItem: ItemRenderer<AuctionDetails>;
    }) {
        return (
            <div className="flex-shrink-0" style={{ width: `${ITEM_WIDTH}px` }}>
                {renderItem(item)}
            </div>
        );
    },
    // Re-render only if item reference or index or renderer function changes
    (prev, next) => prev.item.name === next.item.name,
) as (props: { item: AuctionDetails; renderItem: ItemRenderer<AuctionDetails> }) => JSX.Element;

interface CarouselProps {
    /** Data items to render */
    items: AuctionDetails[];
    /** Render function for each item */
    renderItem: (item: AuctionDetails) => ReactNode;
    className?: string;
    /** Autoplay enabled */
    autoPlay?: boolean;
    /** Autoplay interval in ms */
    autoPlaySpeed?: number;
    /** Pause autoplay when hovered */
    pauseOnHover?: boolean;
    /** Provide a stable key per data item; defaults to its array index */
    getItemKey?: (item: AuctionDetails, index: number) => string | number;
}

const ITEM_WIDTH = 220; // px
const ITEM_GAP = 24; // px
const BUFFER_SIZE = 5; // amount of offscreen items rendered left and right

/**
 * Calculate how many carousel items will be visible on the screen
 */
export function calculateVisibleItemsCount(
    containerWidth: number,
    itemWidth: number = ITEM_WIDTH,
    itemGap: number = ITEM_GAP,
    minVisible: number = 1,
): number {
    if (containerWidth <= 0) return minVisible;
    const itemWithGap = itemWidth + itemGap;
    const itemsWithGaps = Math.floor((containerWidth + itemGap) / itemWithGap);
    return Math.max(minVisible, itemsWithGaps);
}

/** Hook to manage autoplay safely */
function useAutoPlay(enabled: boolean, delay: number, isPaused: boolean, tick: () => void) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled || isPaused) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }
        intervalRef.current = setInterval(tick, delay);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, delay, isPaused, tick]);
}

function determineTranslateX(containerWidth: number, itemIndex: number) {
    const containerCenterPx = containerWidth / 2;
    const itemTotalWidth = ITEM_WIDTH + ITEM_GAP;

    const itemPositionInOrder = itemIndex + 1;
    const itemMiddlePx = itemPositionInOrder * itemTotalWidth - ITEM_WIDTH / 2 - ITEM_GAP;

    return containerCenterPx - itemMiddlePx;
}

function defineInitConfig(containerWidth: number) {
    const containerCenter = containerWidth / 2;
    const itemTotalWidth = ITEM_WIDTH + ITEM_GAP;
    const centerItemIndex = Math.ceil(containerCenter / itemTotalWidth);

    return {
        translateX: determineTranslateX(containerWidth, centerItemIndex),
        centerItemIndex: centerItemIndex,
    };
}

function addKeys(items: AuctionDetails[]) {
    return items.map((item, index) => ({
        ...item,
        key: `${item.name}__${index}`,
    }));
}

export function Carousel({
    items,
    renderItem,
    className = '',
    autoPlay = false,
    autoPlaySpeed = 2500,
    pauseOnHover = true,
    getItemKey,
}: CarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [visibleItems, setVisibleItems] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [translateX, setTranslateX] = useState(0);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [withTransition, setWithTransition] = useState(false);
    const [hasMeasured, setHasMeasured] = useState(false);

    const itemsWithKeys = useMemo(() => {
        if (!visibleItems) return [];

        if (items.length < visibleItems + BUFFER_SIZE) {
            const requiredLength = visibleItems + BUFFER_SIZE;
            const duplicated = Array.from({ length: requiredLength }).map(
                (_, i) => items[i % items.length],
            );
            return addKeys(duplicated);
        }

        return addKeys(items);
    }, [items, visibleItems]);

    const itemsToRender = useMemo(() => {
        if (itemsWithKeys.length === 0 || !containerWidth) return [];
        const totalSlots = Math.min(itemsWithKeys.length, visibleItems + BUFFER_SIZE);
        const startIndex = currentIndex;

        const result = [];
        for (let i = 0; i < totalSlots; i++) {
            const itemIndex = (startIndex + i) % itemsWithKeys.length;
            result.push(itemsWithKeys[itemIndex]);
        }

        return result;
    }, [itemsWithKeys, currentIndex, visibleItems, containerWidth]);

    const options = {
        canSlide: items.length > visibleItems,
    };

    const updateTransformWithoutAnimation = useCallback((cb: () => void) => {
        setWithTransition(false);
        requestAnimationFrame(() => {
            cb();
            requestAnimationFrame(() => {
                setWithTransition(true);
            });
        });
    }, []);

    const handleTransitionEnd = () => {
        if (!withTransition) return;
        setWithTransition(false);

        requestAnimationFrame(() => {
            const { translateX: initialTranslateX } = defineInitConfig(containerWidth);
            setTranslateX(initialTranslateX);
            setCurrentIndex((prev) => (prev + 1) % items.length);

            requestAnimationFrame(() => {
                setWithTransition(true);
            });
        });
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? el.offsetWidth;
            setContainerWidth(w);
            setVisibleItems(calculateVisibleItemsCount(w));
            if (!hasMeasured) setHasMeasured(true);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [hasMeasured]);

    useEffect(() => {
        if (!containerWidth) return;
        updateTransformWithoutAnimation(() => {
            const { translateX } = defineInitConfig(containerWidth);
            setTranslateX(translateX);
        });
    }, [containerWidth, updateTransformWithoutAnimation]);

    const canSlide = items.length > visibleItems;

    const manualNext = useCallback(() => {
        if (!canSlide || items.length === 0) return;

        // Enable transition for the visual shift animation
        setWithTransition(true);

        // Update currentIndex without animation (this triggers DOM virtualization)
        // The transition will be for the translateX change only

        // Calculate new translateX to shift one item (this will be animated)
        const itemWithGap = ITEM_WIDTH + ITEM_GAP;
        setTranslateX((prev) => prev - itemWithGap);

        console.log('manual next');
    }, [canSlide, items.length]);

    useAutoPlay(autoPlay && canSlide, autoPlaySpeed, pauseOnHover && isHovered, manualNext);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden outline-none ${className}`}
            tabIndex={0}
            onMouseEnter={() => pauseOnHover && setIsHovered(true)}
            onMouseLeave={() => pauseOnHover && setIsHovered(false)}
        >
            <button onClick={manualNext}>next</button>
            <div
                ref={trackRef}
                className={`flex ${withTransition ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{
                    transform: `translateX(${translateX}px)`,
                    gap: `${ITEM_GAP}px`,
                    visibility: hasMeasured ? 'visible' : 'hidden',
                }}
                onTransitionEnd={handleTransitionEnd}
            >
                {itemsToRender.map((item) => (
                    <CarouselItem key={item.key} item={item} renderItem={renderItem} />
                ))}
            </div>
        </div>
    );
}
