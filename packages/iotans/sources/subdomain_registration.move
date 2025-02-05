// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A wrapper for `IotansRegistration` subdomain objects.
///
/// With the wrapper, we are allowing easier distinction between second
/// level names & subdomains in RPC Querying | filtering.
///
/// We maintain all core functionality unchanged for registry, expiration etc.
module iotans::subdomain_registration;

use iota::clock::Clock;
use iotans::iotans_registration::IotansRegistration;

/* friend iotans::registry; */
/* #[test_only] */
/* friend iotans::sub_name_tests; */

/// === Error codes ===
///
/// NFT is expired.
const EExpired: u64 = 1;
/// NFT is not a subdomain.
const ENotSubdomain: u64 = 2;
/// Tries to destroy a subdomain that has not expired.
const ENameNotExpired: u64 = 3;

/// A wrapper for IotansRegistration object specifically for SubNames.
public struct SubDomainRegistration has key, store {
    id: UID,
    nft: IotansRegistration,
}

/// Creates a `SubName` wrapper for IotansRegistration object
/// (as long as it's used for a subdomain).
public(package) fun new(
    nft: IotansRegistration,
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

/// Destroys the wrapper and returns the IotansRegistration object.
/// Fails if the subname is not expired.
public(package) fun burn(
    name: SubDomainRegistration,
    clock: &Clock,
): IotansRegistration {
    // tries to unwrap a non-expired subname.
    assert!(name.nft.has_expired(clock), ENameNotExpired);

    let SubDomainRegistration {
        id,
        nft,
    } = name;

    id.delete();
    nft
}

public fun nft(name: &SubDomainRegistration): &IotansRegistration {
    &name.nft
}

public fun nft_mut(name: &mut SubDomainRegistration): &mut IotansRegistration {
    &mut name.nft
}
