// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::update_image;

use std::string::{utf8, String};
use iota::bcs;
use iota::clock::Clock;
use iota::ecdsa_k1;
use iota_names::config::Config;
use iota_names::registry::Registry;
use iota_names::iota_names::IotaNames;
use iota_names::iota_names_nft::IotaNamesNft;

/// Message data cannot be parsed.
const EInvalidData: u64 = 0;
/// The parsed name does not match the expected domain.
const EInvalidDomainData: u64 = 1;
/// Invalid signature for the message.
const ESignatureNotMatch: u64 = 2;

/// Authorization token for the app.
public struct UpdateImage has drop {}

/// Updates the image attached to a `IotaNamesNft`.
entry fun update_image_url(
    iota_names: &IotaNames,
    nft: &mut IotaNamesNft,
    raw_msg: vector<u8>,
    signature: vector<u8>,
    clock: &Clock,
) {
    iota_names.assert_app_is_authorized<UpdateImage>();
    let registry = iota_names.registry<Registry>();
    registry.assert_nft_is_authorized(nft, clock);

    let config = iota_names.get_config<Config>();

    assert!(
        ecdsa_k1::secp256k1_verify(
            &signature,
            config.public_key(),
            &raw_msg,
            1,
        ),
        ESignatureNotMatch,
    );

    let (
        ipfs_hash,
        domain_name,
        expiration_timestamp_ms,
        _data,
    ) = image_data_from_bcs(raw_msg);

    assert!(
        nft.expiration_timestamp_ms() == expiration_timestamp_ms,
        EInvalidData,
    );
    assert!(nft.domain().to_string() == domain_name, EInvalidDomainData);

    nft.update_image_url(ipfs_hash);

    // TODO emit an event
    // event::emit(ImageUpdatedEvent {
    //     sender: tx_context::sender(ctx),
    //     domain_name: nft.name,
    //     new_image: nft.url,
    //     data: additional_data,
    // })
}

/// Parses the message bytes into the image data.
/// ```
/// struct MessageData {
///   ipfs_hash: String,
///   domain_name: String,
///   expiration_timestamp_ms: u64,
///   data: String
/// }
/// ```
fun image_data_from_bcs(msg_bytes: vector<u8>): (String, String, u64, String) {
    let mut bcs = bcs::new(msg_bytes);

    let ipfs_hash = utf8(bcs.peel_vec_u8());
    let domain_name = utf8(bcs.peel_vec_u8());
    let expiration_timestamp_ms = bcs.peel_u64();
    let data = utf8(bcs.peel_vec_u8());

    let remainder = bcs.into_remainder_bytes();
    remainder.destroy_empty();

    (ipfs_hash, domain_name, expiration_timestamp_ms, data)
}
