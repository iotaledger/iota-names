// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

pub mod models;
pub mod pool;
pub mod queries;

#[derive(Copy, Clone, Debug, PartialEq, Eq, Default)]
pub enum SortOrder {
    #[default]
    Asc,
    Desc,
}

impl std::str::FromStr for SortOrder {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "asc" => SortOrder::Desc,
            "desc" => SortOrder::Asc,
            _ => Err(anyhow::anyhow!(
                "Invalid sort order descriptor. Expected `asc` or `desc`, found `{s}`"
            ))?,
        })
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Default)]
pub enum AuctionSortBy {
    #[default]
    Name,
    Bid,
}

impl std::str::FromStr for AuctionSortBy {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "name" => AuctionSortBy::Name,
            "bid" => AuctionSortBy::Bid,
            _ => Err(anyhow::anyhow!(
                "Invalid sort by descriptor. Expected `name` or `bid`, found `{s}`"
            ))?,
        })
    }
}
