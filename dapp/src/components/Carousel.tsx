// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Helper type for the render function
type ItemRenderer<T> = (item: T, index: number) => React.ReactNode;

// Memoized item wrapper to prevent re-render when item/index unchanged
const CarouselItem = React.memo(
    function CarouselItem<T>({
        item,
        index,
        renderItem,
    }: {
        item: T;
        index: number;
        renderItem: ItemRenderer<T>;
    }) {
        return (
            <div className="flex-shrink-0" style={{ width: `${ITEM_WIDTH}px` }}>
                {renderItem(item, index)}
            </div>
        );
    },
    // Re-render only if item reference or index or renderer function changes
    (prev, next) =>
        prev.index === next.index && prev.item === next.item && prev.renderItem === next.renderItem,
) as unknown as <T>(props: { item: T; index: number; renderItem: ItemRenderer<T> }) => JSX.Element;

interface CarouselProps<T = unknown> {
    /** Data items to render */
    items: T[];
    /** Render function for each item */
    renderItem: (item: T, index: number) => ReactNode;
    className?: string;
    /** Autoplay enabled */
    autoPlay?: boolean;
    /** Autoplay interval in ms */
    autoPlaySpeed?: number;
    /** Pause autoplay when hovered */
    pauseOnHover?: boolean;
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
    maxVisible?: number,
): number {
    if (containerWidth <= 0) return minVisible;
    const itemsWithGaps = Math.floor((containerWidth + itemGap) / (itemWidth + itemGap));
    let visibleItems = Math.max(minVisible, itemsWithGaps);
    if (maxVisible !== undefined) visibleItems = Math.min(visibleItems, maxVisible);
    return visibleItems;
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

export function Carousel<T = unknown>({
    items,
    renderItem,
    className = '',
    autoPlay = true,
    autoPlaySpeed = 2500,
    pauseOnHover = true,
}: CarouselProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [visibleItems, setVisibleItems] = useState(1);
    const [isHovered, setIsHovered] = useState(false);

    const [committedIndex, setCommittedIndex] = useState(0); // drives DOM/window (what is rendered)
    const [visualIndex, setVisualIndex] = useState(0); // drives transform during animation
    const [withTransition, setWithTransition] = useState(true);
    const animatingRef = useRef<null | 1 | -1>(null); // direction of current animation

    // Resize observer for stable/responsive behavior
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? el.offsetWidth;
            setContainerWidth(w);
            setVisibleItems(calculateVisibleItemsCount(w));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Keep committedIndex and visualIndex bounded when items change to avoid large values growing indefinitely
    useEffect(() => {
        if (items.length === 0) {
            setCommittedIndex(0);
            setVisualIndex(0);
            return;
        }
        setCommittedIndex((prev) => {
            const maxAbs = items.length * 1000;
            const safe =
                prev > maxAbs || prev < -maxAbs
                    ? ((prev % items.length) + items.length) % items.length
                    : prev;
            // keep visual aligned when we clamp
            setVisualIndex((v) => v - prev + safe);
            return safe;
        });
    }, [items.length]);

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

    const itemsToRender = useMemo(
        () => getSlidingItems(items, committedIndex, visibleItems, BUFFER_SIZE),
        [items, committedIndex, visibleItems],
    );

    const transform = useMemo(
        () =>
            computeTranslateX(items.length, visibleItems, visualIndex, containerWidth, BUFFER_SIZE),
        [items.length, visibleItems, visualIndex, containerWidth],
    );

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
            {/* Track */}
            <div
                ref={trackRef}
                className={`flex ${withTransition ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{
                    transform,
                    gap: `${ITEM_GAP}px`,
                }}
                onTransitionEnd={handleTransitionEnd}
            >
                {items.length === 0 && (
                    <div style={{ width: `${ITEM_WIDTH}px` }} className="flex-shrink-0" />
                )}

                {items.length <= visibleItems
                    ? // Everything fits: render all, centered via computeTranslateX
                      items.map((item, i) => (
                          <CarouselItem
                              key={`idx-${i}`}
                              item={item}
                              index={i}
                              renderItem={renderItem}
                          />
                      ))
                    : // Virtualized sliding window
                      itemsToRender.map(({ item, originalIndex }) => (
                          <CarouselItem
                              key={`idx-${originalIndex}`}
                              item={item}
                              index={originalIndex}
                              renderItem={renderItem}
                          />
                      ))}
            </div>
        </div>
    );
}
