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
        auction_house_id: ObjectID,
        iota_names_config: IotaNamesConfig,
    ) -> Self {
        Self {
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
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
            std::env::var("IOTA_NAMES_AUCTION_HOUSE_OBJECT_ID")?.parse()?,
            iota_names_config,
        ))
    }

    // TODO add mainnet https://github.com/iotaledger/iota/issues/6532
    // TODO add testnet https://github.com/iotaledger/iota/issues/6531

    // Create a config based on the package and object ids published on devnet.
    pub fn devnet() -> Self {
        const AUCTION_PACKAGE_ADDRESS: &str =
            "0x3263bf636c2f60b04a7bf376b0048c36cc0268afee6abaaaceee765d5ea3f3cf";
        const COUPONS_PACKAGE_ADDRESS: &str =
            "0x7add42bba66f170587fb5ead0c411f3356c54f9e0f9d11028a230702eab6ea60";
        const SUBNAMES_PACKAGE_ADDRESS: &str =
            "0xa61121b31bc079e3dcc8e8e0c97857bde9eb077cd90070fbec737246161922b1";
        const AUCTION_HOUSE_ID: &str =
            "0xcb9e1c857825e61211d1ea7507847d8b8145e0a890f3392c56771af2a77c932c";

        let auction_package_address = IotaAddress::from_str(AUCTION_PACKAGE_ADDRESS).unwrap();
        let coupons_package_address = IotaAddress::from_str(COUPONS_PACKAGE_ADDRESS).unwrap();
        let subnames_package_address = IotaAddress::from_str(SUBNAMES_PACKAGE_ADDRESS).unwrap();
        let auction_house_id = ObjectID::from_str(AUCTION_HOUSE_ID).unwrap();

        Self::new(
            auction_package_address,
            coupons_package_address,
            subnames_package_address,
            auction_house_id,
            IotaNamesConfig::devnet(),
        )
    }

    /// Checks whether the given package address is an IOTA-Names one.
    pub fn is_iota_names_package(&self, package_address: impl Into<IotaAddress>) -> bool {
        let package_address = package_address.into();

        package_address == self.auction_package_address
            || package_address == self.coupons_package_address
            || package_address == self.iota_names_config.package_address
            || package_address == self.iota_names_config.payments_package_address
            || package_address == self.subnames_package_address
    }
}
