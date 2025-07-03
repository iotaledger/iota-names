// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Search, Suggestion } from '@iota/apps-ui-kit';
import { useEffect, useState } from 'react';

export default function SearchBox() {
    const [searchValue, setSearchValue] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const allSuggestions: Suggestion[] = [
        { id: '1', label: 'IOTA' },
        { id: '2', label: 'Shimmer' },
        { id: '3', label: 'Tangle' },
    ];

    useEffect(() => {
        if (searchValue.length === 0) {
            setFilteredSuggestions([]);
            return;
        }

        setIsLoading(true);
        const timeout = setTimeout(() => {
            const results = allSuggestions.filter((s) =>
                s.label.toLowerCase().includes(searchValue.toLowerCase()),
            );
            setFilteredSuggestions(results);
            setIsLoading(false);
        }, 300); // Simulate debounce + fetch delay

        return () => clearTimeout(timeout);
    }, [searchValue]);

    const handleSuggestionClick = (suggestion: Suggestion) => {
        alert(`You selected: ${suggestion.label}`);
    };

    return (
        <Search
            searchValue={searchValue}
            onSearchValueChange={setSearchValue}
            suggestions={filteredSuggestions}
            onSuggestionClick={handleSuggestionClick}
            placeholder="Search something..."
            isLoading={isLoading}
            renderSuggestion={(sug, i) => <div className="text-body-md text-left">{sug.label}</div>}
        />
    );
}
