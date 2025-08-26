// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import React from 'react';

import { Carousel } from './Carousel';

// Example component to demonstrate virtualized carousel
export function CarouselExample() {
    // Generate a large dataset (100 items) to test virtualization
    const items = Array.from({ length: 100 }, (_, index) => (
        <div
            key={index}
            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white text-center flex items-center justify-center h-32"
        >
            <div>
                <div className="text-2xl font-bold">#{index + 1}</div>
                <div className="text-sm opacity-80">Item {index + 1}</div>
            </div>
        </div>
    ));

    return (
        <div className="space-y-8 p-8">
            <h1 className="text-3xl font-bold text-center">Carousel Examples</h1>

            {/* Regular carousel with small dataset */}
            <section>
                <h2 className="text-xl font-semibold mb-4">
                    Carousel with Small Dataset (10 items)
                </h2>
                <p className="text-gray-600 mb-4">
                    Small datasets are rendered completely for optimal performance.
                </p>
                <Carousel className="w-full" autoPlay={true} autoPlaySpeed={3000}>
                    {items.slice(0, 10)}
                </Carousel>
            </section>

            {/* Virtualized carousel with large dataset */}
            <section>
                <h2 className="text-xl font-semibold mb-4">
                    Carousel with Large Dataset (100 items)
                </h2>
                <p className="text-gray-600 mb-4">
                    Large datasets automatically use virtualization. Only visible items + buffer are
                    rendered. Open browser DevTools to see only ~7-10 DOM elements instead of 100!
                </p>
                <Carousel className="w-full" autoPlay={true} autoPlaySpeed={2000}>
                    {items}
                </Carousel>
            </section>

            {/* Performance comparison info */}
            <section className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Performance Benefits</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                        • <strong>DOM Elements:</strong> Regular: {items.length} elements,
                        Virtualized: ~7-10 elements
                    </li>
                    <li>
                        • <strong>Memory Usage:</strong> Constant DOM size regardless of dataset
                        size
                    </li>
                    <li>
                        • <strong>Render Performance:</strong> No performance degradation with large
                        datasets
                    </li>
                    <li>
                        • <strong>Scroll Performance:</strong> Smooth scrolling even with 1000+
                        items
                    </li>
                </ul>
            </section>
        </div>
    );
}

// Hook example for external navigation controls
export function CarouselWithControls() {
    const items = Array.from({ length: 20 }, (_, index) => (
        <div
            key={index}
            className="bg-gradient-to-br from-green-500 to-blue-500 rounded-lg p-4 text-white text-center flex items-center justify-center h-32"
        >
            <div>
                <div className="text-2xl font-bold">#{index + 1}</div>
                <div className="text-sm opacity-80">Controlled Item</div>
            </div>
        </div>
    ));

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Carousel with External Controls</h2>

            {/* Note: To use external controls, you'd need to expose the carousel state */}
            {/* This is just a demonstration of the concept */}
            <div className="flex gap-2 justify-center">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Previous
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Next
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Go to Item 10
                </button>
            </div>

            <Carousel className="w-full" autoPlay={false}>
                {items}
            </Carousel>
        </div>
    );
}
