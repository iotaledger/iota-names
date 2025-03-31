// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A wrapper for `IotaNamesRegistration` subdomain objects.
///
/// With the wrapper, we are allowing easier distinction between second
/// level names & subdomains in RPC Querying | filtering.
///
/// We maintain all core functionality unchanged for registry, expiration etc.
module iota_names::subdomain_registration;

use iota::clock::Clock;
use iota_names::iota_names_registration::IotaNamesRegistration;

/* friend iota_names::registry; */
/* #[test_only] */
/* friend iota_names::sub_name_tests; */

/// === Error codes ===
#[error]
const EExpired: vector<u8> = b"NFT is expired.";
#[error]
const ENotSubdomain: vector<u8> = b"NFT is not a subdomain.";
#[error]
const ENameNotExpired: vector<u8> = b"Tries to destroy a subdomain that has not expired.";

/// A wrapper for IotaNamesRegistration object specifically for SubNames.
public struct SubDomainRegistration has key, store {
    id: UID,
    nft: IotaNamesRegistration,
}

/// Creates a `SubName` wrapper for IotaNamesRegistration object
/// (as long as it's used for a subdomain).
public(package) fun new(
    nft: IotaNamesRegistration,
    clock: &Clock,
    ctx: &mut TxContext,
): SubDomainRegistration {
    // Can't wrap a non-subdomain NFT.
    assert!(nft.domain().is_subdomain(), ENotSubdomain);
    // Can't wrap an expired NFT.
    assert!(!nft.has_expired(clock), EExpired);

    SubDomainRegistration {
        id: object::new(ctx),
        nft: nft,
    }
}

/// Destroys the wrapper and returns the IotaNamesRegistration object.
/// Fails if the subname is not expired.
public(package) fun burn(
    name: SubDomainRegistration,
    clock: &Clock,
): IotaNamesRegistration {
    // tries to unwrap a non-expired subname.
    assert!(name.nft.has_expired(clock), ENameNotExpired);

    let SubDomainRegistration {
        id,
        nft,
    } = name;

    id.delete();
    nft
}

public fun nft(name: &SubDomainRegistration): &IotaNamesRegistration {
    &name.nft
}

public fun nft_mut(name: &mut SubDomainRegistration): &mut IotaNamesRegistration {
    &mut name.nft
}
