// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { ListItem, Search, SearchBarType, Suggestion } from '@iota/apps-ui-kit';
import clsx from 'clsx';
import { useState } from 'react';

export default function SearchBox() {
    const [searchValue, setSearchValue] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);

    const allSuggestions: Suggestion[] = [
        { id: '1', label: 'Daiki', supportingText: 'Caption' },
        { id: '2', label: 'Iota' },
        { id: '3', label: 'Pepe' },
        { id: '4', label: 'Gon' },
    ];

    const handleSearchValueChange = (value: string) => {
        setSearchValue(value);
        const filtered =
            allSuggestions.filter((suggestion) =>
                suggestion.label.toLowerCase().includes(value.toLowerCase()),
            ) || [];
        setFilteredSuggestions(filtered);
    };

    const handleSuggestionClick = (suggestion: Suggestion) => {
        setSearchValue(suggestion.label);
        setFilteredSuggestions([]);
    };

    return (
        <div className="max-w-[360px] h-full w-full">
            <Search
                searchValue={searchValue}
                suggestions={filteredSuggestions}
                onSearchValueChange={handleSearchValueChange}
                onSuggestionClick={handleSuggestionClick}
                renderSuggestion={(suggestion) => (
                    <ListItem
                        key={suggestion.id}
                        showRightIcon={false}
                        onClick={() => handleSuggestionClick(suggestion)}
                        hideBottomBorder
                    >
                        <div
                            className={clsx(
                                'flex w-full flex-row items-center gap-xs',
                                suggestion.supportingText ? 'justify-between' : 'justify-start',
                            )}
                        >
                            <span className="text-body-lg text-names-neutral-92">
                                {suggestion.label}
                            </span>
                            <span className="text-body-md text-names-neutral-60">
                                {suggestion.supportingText}
                            </span>
                        </div>
                    </ListItem>
                )}
                placeholder={'Search for your IOTA name'}
                isLoading={false}
                type={SearchBarType.Filled}
            />
        </div>
    );
}
