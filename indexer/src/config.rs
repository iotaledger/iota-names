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
        Self::mainnet()
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
            Chain::Mainnet => Self::mainnet(),
            Chain::Testnet => Self::testnet(),
            Chain::Unknown => Self::devnet(),
        }
    }

    // Create a config based on the package and object ids published on mainnet.
    pub fn mainnet() -> Self {
        const AUCTION_PACKAGE_ADDRESS: &str =
            "0x7f58de1c1a2664390d410382c8958098374baa0c6a937e2faac21ea783fe6824";
        const COUPONS_PACKAGE_ADDRESS: &str =
            "0x6c16703f7b8fc1bfd90b0d412edf3dcc898787b51068eef28d7e38b454638f4e";
        const SUBNAMES_PACKAGE_ADDRESS: &str =
            "0x772859a9d860acc1e49905cf3bd4bedd932cf2a172c3802714dbea5b2acc6420";
        const TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS: &str =
            "0x868e32df312bd642086e4745c1d05aaafc1a51d0e001a7be399e3894a6714b9f";
        const AUCTION_HOUSE_ID: &str =
            "0x3694c17bbcf60c916b2484a76e9a3f7289d214fd7a43b554dcdce0c2ffc04295";

        let auction_package_address = IotaAddress::from_str(AUCTION_PACKAGE_ADDRESS).unwrap();
        let coupons_package_address = IotaAddress::from_str(COUPONS_PACKAGE_ADDRESS).unwrap();
        let subnames_package_address = IotaAddress::from_str(SUBNAMES_PACKAGE_ADDRESS).unwrap();
        let subname_proxy_package_address =
            IotaAddress::from_str(TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS).unwrap();
        let auction_house_id = ObjectID::from_str(AUCTION_HOUSE_ID).unwrap();

        let iota_names_config = IotaNamesConfig::mainnet();
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
            "0xf72b8a015c295a4ba2b531b24403330ce5534035aa7cc33e6bcd172a6701793e";
        const COUPONS_PACKAGE_ADDRESS: &str =
            "0x713ae60a97fab93d71efa2cb3429987b174904c7c6849feb740348ee79c77bb2";
        const SUBNAMES_PACKAGE_ADDRESS: &str =
            "0x03836922e3df08d8206c7adfd9e0874e1e60f0ee4479a43c690167d8b856dae0";
        const TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS: &str =
            "0x1fe851a955780df3731159ba6385e992cb6d24f356500707aad15a288405445f";
        const AUCTION_HOUSE_ID: &str =
            "0xeca91f398c120aa04736d0c8e67400c824c28890d3fbe2d9ddff2f57e539fa15";

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
