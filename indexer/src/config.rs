// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::str::FromStr;

use iota_names::config::IotaNamesConfig;
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
    pub fn new(
        auction_package_address: IotaAddress,
        coupons_package_address: IotaAddress,
        subnames_package_address: IotaAddress,
        subname_proxy_package_address: IotaAddress,
        auction_house_id: ObjectID,
        iota_names_config: IotaNamesConfig,
    ) -> Self {
        Self {
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
            subname_proxy_package_address,
            auction_house_id,
            iota_names_config,
        }
    }

    pub fn from_env() -> anyhow::Result<Self> {
        let iota_names_config = IotaNamesConfig::from_env()?;

        Ok(Self::new(
            std::env::var("IOTA_NAMES_AUCTION_PACKAGE_ADDRESS")?.parse()?,
            std::env::var("IOTA_NAMES_COUPONS_PACKAGE_ADDRESS")?.parse()?,
            std::env::var("IOTA_NAMES_SUBNAMES_PACKAGE_ADDRESS")?.parse()?,
            std::env::var("IOTA_NAMES_TEMP_SUBNAME_PROXY_PACKAGE_ADDRESS")?.parse()?,
            std::env::var("IOTA_NAMES_AUCTION_HOUSE_OBJECT_ID")?.parse()?,
            iota_names_config,
        ))
    }

    // TODO add mainnet https://github.com/iotaledger/iota/issues/6532
    // TODO add testnet https://github.com/iotaledger/iota/issues/6531

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

        Self::new(
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
            subname_proxy_package_address,
            auction_house_id,
            IotaNamesConfig::devnet(),
        )
    }

    /// Checks whether the given package address is an IOTA-Names one.
    pub fn is_iota_names_package(&self, package_address: impl Into<IotaAddress>) -> bool {
        [
            self.auction_package_address,
            self.coupons_package_address,
            self.iota_names_config.package_address,
            self.iota_names_config.payments_package_address,
            self.subnames_package_address,
            self.subname_proxy_package_address,
        ]
        .contains(&package_address.into())
    }
}
