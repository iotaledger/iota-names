// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A wrapper for `IotaNamesRegistration` subname objects.
///
/// With the wrapper, we are allowing easier distinction between second
/// level names & subnames in RPC Querying | filtering.
///
/// We maintain all core functionality unchanged for registry, expiration etc.
module iota_names::subname_registration;

use iota::clock::Clock;
use iota_names::iota_names_registration::IotaNamesRegistration;

/* friend iota_names::registry; */
/* #[test_only] */
/* friend iota_names::sub_name_tests; */

/// === Error codes ===
#[error]
const ENftExpired: vector<u8> = b"NFT is expired.";
#[error]
const ENotSubname: vector<u8> = b"NFT is not a subname.";
#[error]
const ENameNotExpired: vector<u8> = b"Tried to destroy a subname that has not expired.";

/// A wrapper for IotaNamesRegistration object specifically for SubNames.
public struct SubnameRegistration has key, store {
    id: UID,
    nft: IotaNamesRegistration,
}

/// Creates a `SubName` wrapper for IotaNamesRegistration object
/// (as long as it's used for a subname).
public(package) fun new(
    nft: IotaNamesRegistration,
    clock: &Clock,
    ctx: &mut TxContext,
): SubnameRegistration {
    // Can't wrap a non-subname NFT.
    assert!(nft.name().is_subname(), ENotSubname);
    // Can't wrap an expired NFT.
    assert!(!nft.has_expired(clock), ENftExpired);

    SubnameRegistration {
        id: object::new(ctx),
        nft: nft,
    }
}

/// Destroys the wrapper and returns the IotaNamesRegistration object.
/// Fails if the subname is not expired.
public(package) fun burn(name: SubnameRegistration, clock: &Clock): IotaNamesRegistration {
    // tries to unwrap a non-expired subname.
    assert!(name.nft.has_expired(clock), ENameNotExpired);

    let SubnameRegistration {
        id,
        nft,
    } = name;

    id.delete();
    nft
}

public fun nft(name: &SubnameRegistration): &IotaNamesRegistration {
    &name.nft
}

public fun nft_mut(name: &mut SubnameRegistration): &mut IotaNamesRegistration {
    &mut name.nft
}
