// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use iota_names::config::IotaNamesConfig;
use iota_types::base_types::ObjectID;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct IotaNamesExtendedConfig {
    /// ID of the `AuctionHouse` object.
    pub auction_house_id: ObjectID,
    pub iota_names_config: IotaNamesConfig,
}

impl Default for IotaNamesExtendedConfig {
    fn default() -> Self {
        // TODO change to mainnet https://github.com/iotaledger/iota/issues/6532
        // TODO change to testnet https://github.com/iotaledger/iota/issues/6531
        Self::devnet()
    }
}

impl IotaNamesExtendedConfig {
    pub fn new(auction_house_id: ObjectID, iota_names_config: IotaNamesConfig) -> Self {
        Self {
            auction_house_id,
            iota_names_config,
        }
    }

    pub fn from_env() -> anyhow::Result<Self> {
        let iota_names_config = IotaNamesConfig::from_env()?;
        Ok(Self::new(
            std::env::var("IOTA_NAMES_AUCTION_HOUSE_OBJECT_ID")?.parse()?,
            iota_names_config,
        ))
    }

    // TODO add mainnet https://github.com/iotaledger/iota/issues/6532
    // TODO add testnet https://github.com/iotaledger/iota/issues/6531

    // Create a config based on the package and object ids published on devnet.
    pub fn devnet() -> Self {
        const AUCTION_HOUSE_ID: &str =
            "0x31deb8cbd320867089d52c37fed2d443520aac0fc5a957de1f64f9135b83f42b";

        let auction_house_id = ObjectID::from_str(AUCTION_HOUSE_ID).unwrap();
        Self::new(auction_house_id, IotaNamesConfig::devnet())
    }
}
