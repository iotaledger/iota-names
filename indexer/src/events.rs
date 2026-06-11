// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use iota_names::{name::Name, registry::NameRecord};
use iota_sdk_ext::types::{Address, Event};
use iota_types::collection_types::VecMap;
use serde::{Deserialize, Serialize};

use crate::config::IotaNamesExtendedConfig;

#[derive(Debug)]
pub(crate) enum IotaNamesEvent {
    // `auctions`
    AuctionStarted(AuctionStartedEvent),
    AuctionBid(AuctionBidEvent),
    AuctionExtended(AuctionExtendedEvent),
    AuctionFinalized(AuctionFinalizedEvent),
    // `coupons`
    CouponApplied(CouponAppliedEvent),
    // `iota-names`
    NameRecordAdded(NameRecordAddedEvent),
    NameRecordRemoved(NameRecordRemovedEvent),
    TargetAddressSet(TargetAddressSetEvent),
    ReverseLookupSet(ReverseLookupSetEvent),
    ReverseLookupUnset(ReverseLookupUnsetEvent),
    UserDataSet(UserDataSetEvent),
    UserDataUnset(UserDataUnsetEvent),
    Transaction(TransactionEvent),
    // `subnames`
    NodeSubnameCreated(NodeSubnameCreatedEvent),
    NodeSubnameBurned(NodeSubnameBurnedEvent),
    LeafSubnameCreated(LeafSubnameCreatedEvent),
    LeafSubnameRemoved(LeafSubnameRemovedEvent),
}

impl IotaNamesEvent {
    pub(crate) fn try_from_event(
        event: &Event,
        config: &IotaNamesExtendedConfig,
    ) -> anyhow::Result<Option<Self>> {
        if !config.is_iota_names_package(event.type_.address()) {
            return Ok(None);
        }

        Ok(Some(match event.type_.name().as_str() {
            // `auctions`
            "AuctionStartedEvent" => Self::AuctionStarted(bcs::from_bytes(&event.contents)?),
            "AuctionBidEvent" => Self::AuctionBid(bcs::from_bytes(&event.contents)?),
            "AuctionExtendedEvent" => Self::AuctionExtended(bcs::from_bytes(&event.contents)?),
            "AuctionFinalizedEvent" => Self::AuctionFinalized(bcs::from_bytes(&event.contents)?),
            // `coupons`
            "CouponAppliedEvent" => Self::CouponApplied(bcs::from_bytes(&event.contents)?),
            // `iota-names`
            "NameRecordAddedEvent" => Self::NameRecordAdded(bcs::from_bytes(&event.contents)?),
            "NameRecordRemovedEvent" => Self::NameRecordRemoved(bcs::from_bytes(&event.contents)?),
            "TargetAddressSetEvent" => Self::TargetAddressSet(bcs::from_bytes(&event.contents)?),
            "ReverseLookupSetEvent" => Self::ReverseLookupSet(bcs::from_bytes(&event.contents)?),
            "ReverseLookupUnsetEvent" => {
                Self::ReverseLookupUnset(bcs::from_bytes(&event.contents)?)
            }
            "UserDataSetEvent" => Self::UserDataSet(bcs::from_bytes(&event.contents)?),
            "UserDataUnsetEvent" => Self::UserDataUnset(bcs::from_bytes(&event.contents)?),
            "TransactionEvent" => Self::Transaction(bcs::from_bytes(&event.contents)?),
            // `subnames`
            "NodeSubnameCreatedEvent" => {
                Self::NodeSubnameCreated(bcs::from_bytes(&event.contents)?)
            }
            "NodeSubnameBurnedEvent" => Self::NodeSubnameBurned(bcs::from_bytes(&event.contents)?),
            "LeafSubnameCreatedEvent" => {
                Self::LeafSubnameCreated(bcs::from_bytes(&event.contents)?)
            }
            "LeafSubnameRemovedEvent" => {
                Self::LeafSubnameRemoved(bcs::from_bytes(&event.contents)?)
            }
            _ => anyhow::bail!("Invalid event type: {}", event.type_.name()),
        }))
    }
}

// `auctions`

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct AuctionStartedEvent {
    pub name: Name,
    pub start_timestamp_ms: u64,
    pub end_timestamp_ms: u64,
    pub starting_bid: u64,
    pub bidder: Address,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct AuctionBidEvent {
    pub name: Name,
    pub bid: u64,
    pub bidder: Address,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct AuctionExtendedEvent {
    pub name: Name,
    pub end_timestamp_ms: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct AuctionFinalizedEvent {
    pub name: Name,
    pub start_timestamp_ms: u64,
    pub end_timestamp_ms: u64,
    pub winning_bid: u64,
    pub winner: Address,
}

// `coupons`

#[derive(Debug, Serialize, Deserialize)]
#[repr(u8)]
pub enum CouponKind {
    Percentage = 0,
    Fixed = 1,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CouponAppliedEvent {
    pub kind: CouponKind,
    pub discount: u64,
}

// `iota-names`

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct NameRecordAddedEvent {
    pub name: Name,
    pub name_record: NameRecord,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct NameRecordRemovedEvent {
    pub name: Name,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct TargetAddressSetEvent {
    pub name: Name,
    pub target_address: Option<Address>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct ReverseLookupSetEvent {
    pub default_address: Address,
    pub default_name: Name,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct ReverseLookupUnsetEvent {
    pub default_address: Address,
    pub default_name: Name,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct UserDataSetEvent {
    pub key: String,
    pub value: String,
    pub new: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct UserDataUnsetEvent {
    pub key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct TransactionEvent {
    pub app: String,
    pub name: Name,
    pub years: u8,
    pub request_data_version: u8,
    pub base_amount: u64,
    pub metadata: VecMap<String, String>,
    pub is_renewal: bool,
    pub currency: String,
    pub currency_amount: u64,
}

// `subnames`

#[derive(Debug, Serialize, Deserialize)]
pub struct NodeSubnameCreatedEvent {
    pub name: Name,
    pub expiration_timestamp_ms: u64,
    pub allow_creation: bool,
    pub allow_time_extension: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NodeSubnameBurnedEvent {
    pub name: Name,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LeafSubnameCreatedEvent {
    pub name: Name,
    pub target: Address,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LeafSubnameRemovedEvent {
    pub name: Name,
}
