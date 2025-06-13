// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::convert::TryFrom;

use derive_more::{From, Into};
use diesel::{
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    prelude::*,
    serialize::ToSql,
    sqlite::SqliteValue,
};

use crate::events::AuctionStartedEvent;

#[derive(
    From, Into, PartialOrd, Ord, Debug, Copy, Clone, PartialEq, Eq, FromSqlRow, AsExpression,
)]
#[diesel(sql_type = diesel::sql_types::Binary)]
pub struct IotaAddress(pub iota_types::base_types::IotaAddress);

impl ToSql<diesel::sql_types::Binary, diesel::sqlite::Sqlite> for IotaAddress {
    fn to_sql<'b>(
        &'b self,
        out: &mut diesel::serialize::Output<'b, '_, diesel::sqlite::Sqlite>,
    ) -> diesel::serialize::Result {
        <[u8] as ToSql<diesel::sql_types::Binary, diesel::sqlite::Sqlite>>::to_sql(
            self.0.as_ref(),
            out,
        )
    }
}

impl FromSql<diesel::sql_types::Binary, diesel::sqlite::Sqlite> for IotaAddress {
    fn from_sql(bytes: SqliteValue<'_, '_, '_>) -> diesel::deserialize::Result<Self> {
        let stored = Vec::<u8>::from_sql(bytes)?;
        Ok(iota_types::base_types::IotaAddress::try_from(stored)?.into())
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Queryable, Selectable, Insertable, AsChangeset)]
#[diesel(table_name = crate::db::auctions_table)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub(crate) struct Auction {
    pub domain: String,
    pub start_timestamp_ms: i64,
    pub end_timestamp_ms: i64,
    pub starting_bid: i64,
    pub bidder: IotaAddress,
}

impl TryFrom<AuctionStartedEvent> for Auction {
    type Error = anyhow::Error;

    fn try_from(auction_started_event: AuctionStartedEvent) -> anyhow::Result<Self> {
        Ok(Self {
            domain: auction_started_event.domain.to_string(),
            start_timestamp_ms: auction_started_event.start_timestamp_ms as i64,
            end_timestamp_ms: auction_started_event.end_timestamp_ms as i64,
            starting_bid: auction_started_event.starting_bid as i64,
            bidder: auction_started_event.bidder.try_into()?,
        })
    }
}
