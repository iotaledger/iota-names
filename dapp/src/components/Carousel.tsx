// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface CarouselProps {
    children: ReactNode[];
    className?: string;
    autoPlay?: boolean;
    autoPlaySpeed?: number;
    pauseOnHover?: boolean;
}

const ITEM_WIDTH = 220; // px
const ITEM_GAP = 24; // px

/**
 * Calculate how many carousel items will be visible on the screen
 * @param containerWidth - The width of the carousel container in pixels
 * @param itemWidth - The width of each carousel item in pixels
 * @param itemGap - The gap between carousel items in pixels
 * @param minVisible - Minimum number of items to show (default: 1)
 * @param maxVisible - Maximum number of items to show (optional)
 * @returns The number of items that will be visible
 */
export function calculateVisibleItemsCount(
    containerWidth: number,
    itemWidth: number = ITEM_WIDTH,
    itemGap: number = ITEM_GAP,
    minVisible: number = 1,
    maxVisible?: number,
): number {
    if (containerWidth <= 0) return minVisible;

    // Calculate how many items can fit: (containerWidth + gap) / (itemWidth + gap)
    // We add gap to containerWidth because the last item doesn't need a trailing gap
    const itemsWithGaps = Math.floor((containerWidth + itemGap) / (itemWidth + itemGap));

    // Ensure we show at least minVisible items
    let visibleItems = Math.max(minVisible, itemsWithGaps);

    // Apply maximum limit if specified
    if (maxVisible !== undefined) {
        visibleItems = Math.min(visibleItems, maxVisible);
    }

    return visibleItems;
}

/**
 * Calculate which items should be rendered based on current position
 * @param currentIndex - Current carousel position
 * @param visibleItems - Number of items visible at once
 * @param totalItems - Total number of items in the dataset
 * @param bufferSize - Extra items to render outside viewport (default: 2)
 * @returns Object with startIndex, endIndex, and offset information
 */
export function calculateVirtualWindow(
    currentIndex: number,
    visibleItems: number,
    totalItems: number,
    bufferSize: number = 2,
): {
    startIndex: number;
    endIndex: number;
    renderStartIndex: number;
    renderEndIndex: number;
    offsetLeft: number;
} {
    if (totalItems <= visibleItems) {
        return {
            startIndex: 0,
            endIndex: totalItems - 1,
            renderStartIndex: 0,
            renderEndIndex: totalItems - 1,
            offsetLeft: 0,
        };
    }

    // Calculate the visible window
    const startIndex = Math.max(0, currentIndex);
    const endIndex = Math.min(totalItems - 1, currentIndex + visibleItems - 1);

    // Add buffer for smooth scrolling
    const renderStartIndex = Math.max(0, startIndex - bufferSize);
    const renderEndIndex = Math.min(totalItems - 1, endIndex + bufferSize);

    // Calculate offset for positioning
    const offsetLeft = renderStartIndex * (ITEM_WIDTH + ITEM_GAP);

    return {
        startIndex,
        endIndex,
        renderStartIndex,
        renderEndIndex,
        offsetLeft,
    };
}

/**
 * Get virtualized items to render
 * @param items - All items array
 * @param virtualWindow - Virtual window calculation result
 * @returns Array of items to render with their original indices
 */
export function getVirtualizedItems<T>(
    items: T[],
    virtualWindow: ReturnType<typeof calculateVirtualWindow>,
): Array<{ item: T; originalIndex: number }> {
    const { renderStartIndex, renderEndIndex } = virtualWindow;
    const virtualizedItems: Array<{ item: T; originalIndex: number }> = [];

    for (let i = renderStartIndex; i <= renderEndIndex; i++) {
        virtualizedItems.push({
            item: items[i],
            originalIndex: i,
        });
    }

    return virtualizedItems;
}

/**
 * Hook for managing carousel navigation with virtualization support
 */
export function useCarouselNavigation(
    totalItems: number,
    visibleItems: number,
    currentIndex: number,
    setCurrentIndex: (index: number | ((prev: number) => number)) => void,
    getInitialOffset: () => number,
) {
    const goToNext = useCallback(() => {
        if (totalItems <= visibleItems) return;
        setCurrentIndex((prev) => prev + 1);
    }, [totalItems, visibleItems, setCurrentIndex]);

    const goToPrevious = useCallback(() => {
        if (totalItems <= visibleItems) return;

        const effectiveIndex =
            currentIndex >= getInitialOffset() ? currentIndex - getInitialOffset() : 0;

        if (effectiveIndex <= 0) {
            // Jump to end for infinite loop
            setCurrentIndex(getInitialOffset() + totalItems - 1);
        } else {
            setCurrentIndex((prev) => prev - 1);
        }
    }, [totalItems, visibleItems, currentIndex, setCurrentIndex, getInitialOffset]);

    const goToIndex = useCallback(
        (index: number) => {
            if (totalItems <= visibleItems) return;

            const targetIndex = getInitialOffset() + (index % totalItems);
            setCurrentIndex(targetIndex);
        },
        [totalItems, visibleItems, setCurrentIndex, getInitialOffset],
    );

    return {
        goToNext,
        goToPrevious,
        goToIndex,
    };
}

export function Carousel({
    children,
    className = '',
    autoPlay = true,
    autoPlaySpeed = 2000,
    pauseOnHover = true,
}: CarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleItems, setVisibleItems] = useState(1);
    const [isHovered, setIsHovered] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate how many items can fit in the container
    const calculateVisibleItems = useCallback(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const newVisibleItems = calculateVisibleItemsCount(containerWidth);
        setVisibleItems(newVisibleItems);
    }, []);

    // Initial offset for infinite scrolling positioning
    const getInitialOffset = useCallback(() => {
        if (children.length <= visibleItems) return 0;
        return Math.max(visibleItems + 2, 5); // Buffer for smooth infinite scrolling
    }, [children.length, visibleItems]);

    // Virtual window calculation - always enabled
    const virtualWindow = useMemo(() => {
        if (children.length <= visibleItems) {
            return null;
        }

        // Calculate effective index for virtualization
        const effectiveIndex =
            currentIndex >= getInitialOffset() ? currentIndex - getInitialOffset() : 0;

        return calculateVirtualWindow(effectiveIndex, visibleItems, children.length);
    }, [currentIndex, visibleItems, children.length, getInitialOffset]);

    // Get virtualized items to render
    const itemsToRender = useMemo(() => {
        if (!virtualWindow || children.length <= visibleItems) {
            // Small dataset: render all items with original indices
            return children.map((child, index) => ({
                item: child,
                originalIndex: index,
            }));
        }

        // Large dataset: render only visible + buffer items
        return getVirtualizedItems(children, virtualWindow);
    }, [children, virtualWindow]);

    // Handle window resize
    useEffect(() => {
        calculateVisibleItems();

        const handleResize = () => {
            calculateVisibleItems();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculateVisibleItems]);

    // Reset position when children or visibleItems change
    useEffect(() => {
        setCurrentIndex(getInitialOffset());
    }, [getInitialOffset]);

    // Auto-advance carousel
    const nextSlide = useCallback(() => {
        if (children.length <= visibleItems) return;

        setCurrentIndex((prevIndex) => prevIndex + 1);
    }, [children.length, visibleItems]);

    // Handle infinite loop reset
    useEffect(() => {
        if (children.length <= visibleItems) return;

        // Calculate effective index for infinite loop management
        const effectiveIndex =
            currentIndex >= getInitialOffset() ? currentIndex - getInitialOffset() : 0;

        if (effectiveIndex >= children.length) {
            // Reset to beginning for infinite loop
            setIsTransitioning(false);
            setCurrentIndex(getInitialOffset());
            requestAnimationFrame(() => {
                setIsTransitioning(true);
            });
        }
    }, [currentIndex, children.length, visibleItems, getInitialOffset]);

    // Setup auto-play
    useEffect(() => {
        if (!autoPlay || children.length <= visibleItems || (pauseOnHover && isHovered)) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(nextSlide, autoPlaySpeed);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [
        autoPlay,
        autoPlaySpeed,
        nextSlide,
        children.length,
        visibleItems,
        isHovered,
        pauseOnHover,
    ]);

    // Calculate transform value
    const getTransformValue = () => {
        if (children.length <= visibleItems) {
            // Center items if they all fit
            const totalWidth = children.length * ITEM_WIDTH + (children.length - 1) * ITEM_GAP;
            const containerWidth = containerRef.current?.offsetWidth || 0;
            const offset = Math.max(0, (containerWidth - totalWidth) / 2);
            return `translateX(${offset}px)`;
        }

        if (virtualWindow) {
            // Virtualized transform: account for virtual offset
            const effectiveIndex =
                currentIndex >= getInitialOffset() ? currentIndex - getInitialOffset() : 0;
            const baseTranslate = -effectiveIndex * (ITEM_WIDTH + ITEM_GAP);
            const virtualOffset = virtualWindow.offsetLeft;
            return `translateX(${baseTranslate + virtualOffset}px)`;
        }

        // Fallback for cases without virtual window
        const effectiveIndex =
            currentIndex >= getInitialOffset() ? currentIndex - getInitialOffset() : 0;
        const translateX = -effectiveIndex * (ITEM_WIDTH + ITEM_GAP);
        return `translateX(${translateX}px)`;
    };

    const handleMouseEnter = () => {
        if (pauseOnHover) {
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        if (pauseOnHover) {
            setIsHovered(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={trackRef}
                className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{
                    transform: getTransformValue(),
                    gap: `${ITEM_GAP}px`,
                }}
            >
                {itemsToRender.map((renderItem, index) => (
                    <div
                        key={`carousel-item-${renderItem.originalIndex}`}
                        className="flex-shrink-0"
                        style={{ width: `${ITEM_WIDTH}px` }}
                    >
                        {renderItem.item}
                    </div>
                ))}
            </div>
        </div>
    );
}
