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
            "asc" => SortOrder::Asc,
            "desc" => SortOrder::Desc,
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
    Ending,
}

impl std::str::FromStr for AuctionSortBy {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "name" => AuctionSortBy::Name,
            "bid" => AuctionSortBy::Bid,
            "ending" => AuctionSortBy::Ending,
            _ => Err(anyhow::anyhow!(
                "Invalid sort by descriptor. Expected `name`, `bid`, or `ending`, found `{s}`"
            ))?,
        })
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Default)]
pub enum AuctionStatus {
    #[default]
    Active,
    Finished,
    Claimed,
}

impl std::str::FromStr for AuctionStatus {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "active" => AuctionStatus::Active,
            "finished" => AuctionStatus::Finished,
            "claimed" => AuctionStatus::Claimed,
            _ => Err(anyhow::anyhow!(
                "Invalid status descriptor. Expected `active`, `finished`, or `claimed`, found `{s}`"
            ))?,
        })
    }
}
