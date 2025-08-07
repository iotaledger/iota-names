// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export const SEPARATOR = '...';

export function getPaginationPages(
    currentPage: number,
    lastPage: number,
    displayCount: number = 6,
): (number | typeof SEPARATOR)[] {
    const pages: (number | typeof SEPARATOR)[] = [];

    // Always include the first page
    if (lastPage >= 1) {
        pages.push(1);
    }

    // Determine the start and end of the main page range
    let startPage = Math.max(2, currentPage - Math.floor(displayCount / 2));
    let endPage = Math.min(lastPage - 1, currentPage + Math.floor(displayCount / 2));

    // Adjust start and end pages if the range is too small
    if (endPage - startPage + 1 < displayCount) {
        if (currentPage <= displayCount) {
            endPage = Math.min(lastPage - 1, displayCount + 1);
        } else if (currentPage > lastPage - displayCount) {
            startPage = Math.max(2, lastPage - displayCount);
        }
    }

    // Add an ellipsis if there's a gap between the first page and the start of the range
    if (startPage > 2) {
        pages.push(SEPARATOR);
    }

    // Add the pages in the main range
    for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== lastPage) {
            pages.push(i);
        }
    }

    // Add an ellipsis if there's a gap between the end of the range and the last page
    if (endPage < lastPage - 1) {
        pages.push(SEPARATOR);
    }

    // Always include the last page (unless it's the same as the first)
    if (lastPage > 1) {
        pages.push(lastPage);
    }

    return pages;
}
