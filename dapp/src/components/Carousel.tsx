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
const BUFFER_SIZE = 3; // amount of offscreen items rendered left and right

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

/** Wrap any integer index to [0, total) */
function wrapIndex(index: number, total: number): number {
    if (total <= 0) return 0;
    return ((index % total) + total) % total;
}

/**
 * Build a stable sliding window describing which data index belongs to each slide position.
 * The slide positions are stable so CSS transforms remain smooth while data indices wrap.
 */
export function calculateSlidingWindow(
    currentIndex: number,
    visibleItems: number,
    totalItems: number,
    bufferSize: number = BUFFER_SIZE,
): Array<{ originalIndex: number; slidePosition: number }> {
    if (totalItems === 0) return [];

    const totalSlots =
        Math.min(totalItems, visibleItems) === totalItems
            ? totalItems
            : visibleItems + bufferSize * 2;

    const windowSpec: Array<{ originalIndex: number; slidePosition: number }> = [];

    for (let slidePosition = 0; slidePosition < totalSlots; slidePosition++) {
        const dataIndex = currentIndex - bufferSize + slidePosition;
        const wrappedIndex = wrapIndex(dataIndex, totalItems);
        windowSpec.push({ originalIndex: wrappedIndex, slidePosition });
    }
    return windowSpec;
}

/** Map window spec to actual items */
export function getSlidingItems<T>(
    items: T[],
    currentIndex: number,
    visibleItems: number,
    bufferSize: number = BUFFER_SIZE,
): Array<{ item: T; originalIndex: number; slidePosition: number }> {
    const spec = calculateSlidingWindow(currentIndex, visibleItems, items.length, bufferSize);
    return spec.map(({ originalIndex, slidePosition }) => ({
        item: items[originalIndex],
        originalIndex,
        slidePosition,
    }));
}

function getWindow<T>(arr: T[], arraySize: number, currentIndex: number): T[] {
    const result: T[] = [];
    const n = arr.length;

    if (n === 0 || arraySize <= 0) return result;

    // normalize currentIndex to 0..n-1
    const start = ((currentIndex % n) + n) % n;

    for (let i = 0; i < arraySize; i++) {
        const idx = (start + i) % n; // wrap around
        result.push(arr[idx]);
    }

    return result;
}

/** Compute translateX for smooth sliding */
function computeTranslateX(
    totalItems: number,
    visibleItems: number,
    currentIndex: number,
    containerWidth: number,
    bufferSize: number = BUFFER_SIZE,
): string {
    // If everything fits, center the whole row
    if (totalItems <= visibleItems) {
        const totalWidth = totalItems * ITEM_WIDTH + Math.max(0, totalItems - 1) * ITEM_GAP;
        const offset = Math.max(0, (containerWidth - totalWidth) / 2);
        return `translateX(${offset}px)`;
    }

    const baseOffset = bufferSize * (ITEM_WIDTH + ITEM_GAP);
    const slideOffset = currentIndex * (ITEM_WIDTH + ITEM_GAP);
    const leftPadding = 0; // we use stable buffers instead
    return `translateX(${leftPadding + baseOffset - slideOffset}px)`;
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

/** Touch swipe support (basic) */
function useSwipe(onLeft: () => void, onRight: () => void) {
    const startX = useRef<number | null>(null);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        startX.current = e.touches[0]?.clientX ?? null;
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        // prevent vertical scroll capture issues minimally
        if (startX.current !== null) e.stopPropagation();
    }, []);

    const onTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            if (startX.current === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? startX.current) - startX.current;
            const threshold = 40; // px
            if (dx <= -threshold) onLeft();
            else if (dx >= threshold) onRight();
            startX.current = null;
        },
        [onLeft, onRight],
    );

    return { onTouchStart, onTouchMove, onTouchEnd };
}

export function useCarouselNavigation(
    totalItems: number,
    visibleItems: number,
    setCurrentIndex: (updater: number | ((p: number) => number)) => void,
) {
    const goToNext = useCallback(() => {
        if (totalItems <= 0) return;
        // keep increasing; window mapping wraps the content
        setCurrentIndex((prev) => prev + 1);
    }, [setCurrentIndex, totalItems]);

    const goToPrevious = useCallback(() => {
        if (totalItems <= 0) return;
        setCurrentIndex((prev) => prev - 1);
    }, [setCurrentIndex, totalItems]);

    const goToIndex = useCallback(
        (index: number) => {
            if (totalItems <= 0) return;
            // move to absolute position (supports infinite since transform is relative)
            const safe = Number.isFinite(index) ? Math.trunc(index) : 0;
            setCurrentIndex(safe);
        },
        [setCurrentIndex, totalItems],
    );

    // prevent movement when not needed
    const canSlide = totalItems > visibleItems;

    return { goToNext, goToPrevious, goToIndex, canSlide };
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

    const [committedIndex, setCommittedIndex] = useState(BUFFER_SIZE);
    const [visualIndex, setVisualIndex] = useState(BUFFER_SIZE);
    const [withTransition, setWithTransition] = useState(false);
    const animatingRef = useRef<null | 1 | -1>(null); // direction of current animation
    const [hasMeasured, setHasMeasured] = useState(false);

    // Resize observer for stable/responsive behavior
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

    // Add this function before the useEffect
    const updateTransformWithoutAnimation = useCallback((containerWidth: number) => {
        // 1. Disable transitions first
        setWithTransition(false);

        // 2. Use requestAnimationFrame to ensure the transition disable is applied
        requestAnimationFrame(() => {
            // 3. Set new transform (this happens without animation)
            const { translateX, centerItemIndex } = defineInitConfig(containerWidth);
            setTranslateX(translateX);
            setVisualIndex(centerItemIndex);

            // 4. Re-enable transitions after another frame
            requestAnimationFrame(() => {
                setWithTransition(true);
            });
        });
    }, []);

    const updateTransformWithAnimation = useCallback(
        (containerWidth: number, itemIndex: number) => {
            setWithTransition(true);
            requestAnimationFrame(() => {
                // 3. Set new transform (this happens without animation)
                const translateX = determineTranslateX(containerWidth, itemIndex);
                setTranslateX(translateX);
                // setVisualIndex(itemIndex);

                // 4. Re-enable transitions after another frame
                requestAnimationFrame(() => {
                    setWithTransition(false);
                });
            });
        },
        [],
    );

    useEffect(() => {
        if (!containerWidth) return;
        updateTransformWithoutAnimation(containerWidth);
    }, [containerWidth]);

    // Keep committedIndex and visualIndex bounded when items change to avoid large values growing indefinitely
    // useEffect(() => {
    //     if (items.length === 0) {
    //         setCommittedIndex(BUFFER_SIZE);
    //         setVisualIndex(BUFFER_SIZE);
    //         return;
    //     }
    //     setCommittedIndex((prev) => {
    //         const maxAbs = items.length * 1000;
    //         const safe =
    //             prev > maxAbs || prev < -maxAbs
    //                 ? ((prev % items.length) + items.length) % items.length
    //                 : prev;
    //         // keep visual aligned when we clamp
    //         setVisualIndex((v) => v - prev + safe);
    //         return safe;
    //     });
    // }, [items.length]);

    const canSlide = items.length > visibleItems;

    const step = useCallback(
        (dir: 1 | -1) => {
            if (!canSlide) return;
            if (animatingRef.current) return; // already animating
            animatingRef.current = dir;
            setWithTransition(true);
            setVisualIndex((v) => v + dir);
        },
        [canSlide],
    );

    const goToNext = useCallback(() => step(1), [step]);
    const goToPrevious = useCallback(() => step(-1), [step]);

    // Autoplay
    useAutoPlay(autoPlay && canSlide, autoPlaySpeed, pauseOnHover && isHovered, goToNext);

    const itemsToRender = useMemo(() => {
        if (items.length === 0 || !containerWidth) return [];
        const indexes = getWindow(items, visibleItems + BUFFER_SIZE, visualIndex);
        console.log(indexes);

        return indexes;
        // console.log('raange', range);

        // return range.map((item, idx) => ({
        //     item,
        //     originalIndex: indexes[minIndex + idx] as number,
        // }));
        // getSlidingItems(items, committedIndex, visibleItems, BUFFER_SIZE)
    }, [items, visualIndex, visibleItems]);

    // const transform = useMemo(() => {
    //     return `translateX(0px)`;
    //     return computeTranslateX(
    //         items.length,
    //         visibleItems,
    //         visualIndex,
    //         containerWidth,
    //         BUFFER_SIZE,
    //     );
    // }, [items.length, visibleItems, visualIndex, containerWidth]);

    const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe(goToNext, goToPrevious);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!canSlide) return;
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'ArrowLeft') goToPrevious();
        },
        [canSlide, goToNext, goToPrevious],
    );

    const handleTransitionEnd = useCallback(() => {
        const dir = animatingRef.current;
        if (!dir) return;
        // 1) Stop transitions to avoid visible jump when we update the window
        setWithTransition(false);
        // 2) Commit the index so the virtualized window shifts (DOM updates happen now)
        setCommittedIndex((c) => c + dir);
        // 3) Align visualIndex with the new committedIndex (no visual change since we stayed at end position)
        setVisualIndex((v) => v);
        // 4) Re-enable transitions for the next move in the next frame
        requestAnimationFrame(() => setWithTransition(true));
        animatingRef.current = null;
    }, []);

    const manualNext = () => {
        const prevTranslateX = translateX;
        
        updateTransformWithAnimation(containerWidth, visualIndex + 1);
        console.log('manual next');
    };

    const transformRaw = `translateX(${translateX}px)`;
    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden outline-none ${className}`}
            tabIndex={0}
            onMouseEnter={() => pauseOnHover && setIsHovered(true)}
            onMouseLeave={() => pauseOnHover && setIsHovered(false)}
            onKeyDown={handleKeyDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <button onClick={manualNext}>next</button>
            <div
                ref={trackRef}
                className={`flex ${withTransition ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{
                    transform: transformRaw,
                    gap: `${ITEM_GAP}px`,
                    visibility: hasMeasured ? 'visible' : 'hidden',
                }}
                onTransitionEnd={handleTransitionEnd}
            >
                {itemsToRender.map((item) => (
                    <CarouselItem key={item.name} item={item} renderItem={renderItem} />
                ))}
            </div>
        </div>
    );
}
