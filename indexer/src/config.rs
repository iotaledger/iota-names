// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::{collections::HashSet, str::FromStr};

use iota_names::config::IotaNamesConfig;
use iota_protocol_config::Chain;
use iota_types::base_types::{IotaAddress, ObjectID};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct IotaNamesExtendedConfig {
    /// Address of the `auction` package.
    pub auction_package_address: IotaAddress,
    /// Address of the `coupons` package.
    pub coupons_package_address: IotaAddress,
    /// Address of the `subnames` package.
    pub subnames_package_address: IotaAddress,
    /// Address of the `temp-subname-proxy` package
    pub subname_proxy_package_address: IotaAddress,
    /// ID of the `AuctionHouse` object.
    pub auction_house_id: ObjectID,
    /// List of package addresses for events. Not strictly defined to support
    /// new versions.
    pub event_package_ids: HashSet<IotaAddress>,
    pub iota_names_config: IotaNamesConfig,
}

impl Default for IotaNamesExtendedConfig {
    fn default() -> Self {
        // TODO change to mainnet https://github.com/iotaledger/iota/issues/6532
        Self::testnet()
    }
}

impl IotaNamesExtendedConfig {
    pub fn new(
        auction_package_address: IotaAddress,
        coupons_package_address: IotaAddress,
        subnames_package_address: IotaAddress,
        subname_proxy_package_address: IotaAddress,
        auction_house_id: ObjectID,
        event_package_ids: HashSet<IotaAddress>,
        iota_names_config: IotaNamesConfig,
    ) -> Self {
        Self {
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
            subname_proxy_package_address,
            auction_house_id,
            event_package_ids,
            iota_names_config,
        }
    }

    pub fn from_env() -> anyhow::Result<Self> {
        let iota_names_config = IotaNamesConfig::from_env()?;

        let event_package_ids: HashSet<IotaAddress> = serde_json::from_str(
            &std::env::var("EVENT_PACKAGE_IDS").unwrap_or_else(|_| "[]".to_string()),
        )?;

        Ok(Self::new(
            std::env::var("IOTA_NAMES_AUCTION_PACKAGE_ADDRESS")?.parse()?,
            std::env::var("IOTA_NAMES_COUPONS_PACKAGE_ADDRESS")?.parse()?,
            std::env::var("IOTA_NAMES_SUBNAMES_PACKAGE_ADDRESS")?.parse()?,
            std::env::var("IOTA_NAMES_TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS")?.parse()?,
            std::env::var("IOTA_NAMES_AUCTION_HOUSE_OBJECT_ID")?.parse()?,
            event_package_ids,
            iota_names_config,
        ))
    }

    pub fn from_chain(chain: &Chain) -> Self {
        match chain {
            // TODO switch to mainnet https://github.com/iotaledger/iota/issues/6532
            Chain::Mainnet => Self::testnet(),
            Chain::Testnet => Self::testnet(),
            Chain::Unknown => Self::devnet(),
        }
    }

    // TODO add mainnet https://github.com/iotaledger/iota/issues/6532

    // Create a config based on the package and object ids published on testnet.
    pub fn testnet() -> Self {
        const AUCTION_PACKAGE_ADDRESS: &str =
            "0x6f727ea576a00036657fff0ae3a6d7c8171b178bf35112d6b83b2a6272cc5f0d";
        const COUPONS_PACKAGE_ADDRESS: &str =
            "0xa7e4e483d79c245470d5eb3c285a4503a78d90a69d36e35e0993012f5c6137ca";
        const SUBNAMES_PACKAGE_ADDRESS: &str =
            "0xd06a5607cc762f2352eeeb8c86c7f962558a06c6023c1eec031a41651d898c87";
        const TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS: &str =
            "0x7f34c135e55e5b436b3feaad369eabfe5b6d14c0c57544fefb6921db047e8cbc";
        const AUCTION_HOUSE_ID: &str =
            "0x2292ea885039babe8c320f19e0b7546ebdef2b2f6cf2be600bf994cdb51e0050";

        let auction_package_address = IotaAddress::from_str(AUCTION_PACKAGE_ADDRESS).unwrap();
        let coupons_package_address = IotaAddress::from_str(COUPONS_PACKAGE_ADDRESS).unwrap();
        let subnames_package_address = IotaAddress::from_str(SUBNAMES_PACKAGE_ADDRESS).unwrap();
        let subname_proxy_package_address =
            IotaAddress::from_str(TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS).unwrap();
        let auction_house_id = ObjectID::from_str(AUCTION_HOUSE_ID).unwrap();

        let iota_names_config = IotaNamesConfig::testnet();
        let event_package_ids = HashSet::from([
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
            subname_proxy_package_address,
            iota_names_config.package_address,
            iota_names_config.payments_package_address,
        ]);

        Self::new(
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
            subname_proxy_package_address,
            auction_house_id,
            event_package_ids,
            iota_names_config,
        )
    }

    // Create a config based on the package and object ids published on devnet.
    pub fn devnet() -> Self {
        const AUCTION_PACKAGE_ADDRESS: &str =
            "0x79c8714ea294a92da04875c77ccabf8d1a06107e80d41c23d6777d5b1e6724a5";
        const COUPONS_PACKAGE_ADDRESS: &str =
            "0xf2d61106ef44216f03709276c4e79c78485080c6d8fbad8464b7a570b9f36470";
        const SUBNAMES_PACKAGE_ADDRESS: &str =
            "0x1efbf928710d0d92635dacff4c502516169d37fa006cabd2f3cdd0123221e09e";
        const TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS: &str =
            "0x4a16b7b2a9c194989519c87ee3f1d1007ece8aecb62b9a50a4c10075db0591a3";
        const AUCTION_HOUSE_ID: &str =
            "0xc922c77a1d4f4e699aa912a7c24aee4668f8975d2a5f01ba780f656289bf2c2c";

        let auction_package_address = IotaAddress::from_str(AUCTION_PACKAGE_ADDRESS).unwrap();
        let coupons_package_address = IotaAddress::from_str(COUPONS_PACKAGE_ADDRESS).unwrap();
        let subnames_package_address = IotaAddress::from_str(SUBNAMES_PACKAGE_ADDRESS).unwrap();
        let subname_proxy_package_address =
            IotaAddress::from_str(TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS).unwrap();
        let auction_house_id = ObjectID::from_str(AUCTION_HOUSE_ID).unwrap();

        let iota_names_config = IotaNamesConfig::devnet();
        let event_package_ids = HashSet::from([
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
            subname_proxy_package_address,
            iota_names_config.package_address,
            iota_names_config.payments_package_address,
        ]);

        Self::new(
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
            subname_proxy_package_address,
            auction_house_id,
            event_package_ids,
            iota_names_config,
        )
    }

    /// Checks whether the given package address is an IOTA-Names one.
    pub fn is_iota_names_package(&self, package_address: impl Into<IotaAddress>) -> bool {
        let package_address = package_address.into();

        self.event_package_ids.contains(&package_address)
    }
}
