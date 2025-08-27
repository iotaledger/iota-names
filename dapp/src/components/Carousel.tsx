// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuctionDetails } from '@/auctions';

type ItemRenderer<T> = (item: T) => React.ReactNode;

/** Hook to track page visibility for pausing animations when tab is not active */
function usePageVisibility() {
    const [isVisible, setIsVisible] = useState(() => {
        if (typeof document !== 'undefined') {
            return !document.hidden;
        }
        return true;
    });

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return isVisible;
}

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
    (prev, next) => prev.item.name === next.item.name && prev.renderItem === next.renderItem,
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
    /** Pause autoplay when page/tab is not visible */
    pauseOnPageHidden?: boolean;
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
        // Clear existing interval if autoplay is disabled or paused
        if (!enabled || isPaused) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Start autoplay interval
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
    pauseOnPageHidden = true,
    getItemKey,
}: CarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [visibleItems, setVisibleItems] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [translateX, setTranslateX] = useState(0);

    // Track page visibility to pause animation when tab is not active
    const isPageVisible = usePageVisibility();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [withTransition, setWithTransition] = useState(false);
    const [hasMeasured, setHasMeasured] = useState(false);

    // Use ref to track transitioning state to avoid dependency loops
    const isTransitioningRef = useRef(false);

    const itemsWithKeys = useMemo(() => {
        if (!visibleItems || !items.length) return [];

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

    const updateTransformWithoutAnimation = useCallback(
        (cb: () => void) => {
            if (isTransitioningRef.current) return;

            isTransitioningRef.current = true;
            setWithTransition(false);
            requestAnimationFrame(() => {
                cb();
                // Use setTimeout instead of nested requestAnimationFrame for more stability
                setTimeout(() => {
                    setWithTransition(true);
                    isTransitioningRef.current = false;
                }, 16);
            });
        },
        [], // No dependencies needed
    );

    const onMouseEnter = useCallback(() => {
        if (pauseOnHover) setIsHovered(true);
    }, [pauseOnHover]);

    const onMouseLeave = useCallback(() => {
        if (pauseOnHover) setIsHovered(false);
    }, [pauseOnHover]);

    const handleTransitionEnd = useCallback(() => {
        if (!withTransition || isTransitioningRef.current) return;

        isTransitioningRef.current = true;

        // Use a more stable approach to handle transitions
        const updateState = () => {
            const { translateX: initialTranslateX } = defineInitConfig(containerWidth);
            setTranslateX(initialTranslateX);
            setCurrentIndex((prev) => (prev + 1) % items.length);
        };

        setWithTransition(false);
        requestAnimationFrame(() => {
            updateState();
            // Add a small delay to ensure DOM updates are completed
            setTimeout(() => {
                setWithTransition(true);
                isTransitioningRef.current = false;
            }, 16); // Next frame
        });
    }, [containerWidth, items.length, withTransition]);

    const next = useCallback(() => {
        if (items.length === 0 || isTransitioningRef.current) return;

        setWithTransition(true);
        const itemWithGap = ITEM_WIDTH + ITEM_GAP;
        setTranslateX((prev) => prev - itemWithGap);
    }, [items.length]);

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

    // Autoplay with pause conditions: hover + page visibility
    const shouldPauseAutoplay =
        (pauseOnHover && isHovered) || (pauseOnPageHidden && !isPageVisible);
    useAutoPlay(autoPlay, autoPlaySpeed, shouldPauseAutoplay, next);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden outline-none ${className}`}
            tabIndex={0}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div
                ref={trackRef}
                className="flex"
                style={{
                    transform: `translateX(${translateX}px)`,
                    gap: `${ITEM_GAP}px`,
                    visibility: hasMeasured ? 'visible' : 'hidden',
                    transition: withTransition ? 'transform 500ms ease-in-out' : 'none',
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
