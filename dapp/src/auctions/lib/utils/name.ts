// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/**
 * Helper function to create a domain object from a domain name string
 * Note: The labels are stored in reverse order according to Domain struct
 * https://github.com/iotaledger/iota/blob/797355f33d982eb90b59542c4bceb0b1c6f8145f/crates/iota-names/src/domain.rs#L19
 * @param domainName - Domain name like "rust.iota"
 * @returns Domain object with labels in reverse order
 */
export function createDomainFromName(domainName: string): { labels: string[] } {
    const labels = domainName.split('.');
    return { labels: labels.reverse() };
}
