// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface CarouselProps {
    children: ReactNode[];
    className?: string;
    autoPlay?: boolean;
    autoPlaySpeed?: number;
    pauseOnHover?: boolean;
}

const ITEM_WIDTH = 220; // px
const ITEM_GAP = 24; // px

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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate how many items can fit in the container
    const calculateVisibleItems = useCallback(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const itemsWithGaps = Math.floor((containerWidth + ITEM_GAP) / (ITEM_WIDTH + ITEM_GAP));
        const newVisibleItems = Math.max(1, itemsWithGaps);
        setVisibleItems(newVisibleItems);
    }, []);

    // Handle window resize
    useEffect(() => {
        calculateVisibleItems();

        const handleResize = () => {
            calculateVisibleItems();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculateVisibleItems]);

    // Auto-advance carousel
    const nextSlide = useCallback(() => {
        if (children.length <= visibleItems) return;

        setCurrentIndex((prevIndex) => {
            const maxIndex = children.length - visibleItems;
            return prevIndex >= maxIndex ? 0 : prevIndex + 1;
        });
    }, [children.length, visibleItems]);

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

        const translateX = -currentIndex * (ITEM_WIDTH + ITEM_GAP);
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
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                    transform: getTransformValue(),
                    gap: `${ITEM_GAP}px`,
                }}
            >
                {children.map((child, index) => (
                    <div key={index} className="flex-shrink-0" style={{ width: `${ITEM_WIDTH}px` }}>
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}
