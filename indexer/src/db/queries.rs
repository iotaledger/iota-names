// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use anyhow::Result;
use diesel::{
    BelongingToDsl, ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper,
    SqliteConnection, TextExpressionMethods, dsl, insert_into,
};

use super::models::{Bid, Bidder, Name, bidders, bids, names};
use crate::db::{AuctionSortBy, SortOrder};

pub fn get_or_create_bidder(conn: &mut SqliteConnection, address: &str) -> Result<Bidder> {
    let maybe_bidder = insert_into(bidders::table)
        .values(bidders::address.eq(address))
        .on_conflict_do_nothing()
        .returning(Bidder::as_returning())
        .get_result(conn)
        .optional()?;

    match maybe_bidder {
        Some(bidder) => Ok(bidder),
        None => bidders::table
            .filter(bidders::address.eq(address))
            .first::<Bidder>(conn)
            .map_err(Into::into),
    }
}

pub fn get_or_create_name(conn: &mut SqliteConnection, name: &str) -> Result<Name> {
    let maybe_name = insert_into(names::table)
        .values(names::name.eq(name))
        .on_conflict_do_nothing()
        .returning(Name::as_returning())
        .get_result(conn)
        .optional()?;

    match maybe_name {
        Some(name) => Ok(name),
        None => names::table
            .filter(names::name.eq(name))
            .first::<Name>(conn)
            .map_err(Into::into),
    }
}

pub fn add_bids_entry(
    conn: &mut SqliteConnection,
    bidder_address: &str,
    name_str: &str,
    bid: u64,
) -> Result<()> {
    let bidder = get_or_create_bidder(conn, bidder_address)?;
    let name = get_or_create_name(conn, name_str)?;
    insert_into(bids::table)
        .values((
            bids::bidder_id.eq(bidder.id),
            bids::name_id.eq(name.id),
            bids::bid.eq(bid as i64),
        ))
        .on_conflict_do_nothing()
        .execute(conn)?;
    Ok(())
}

pub fn get_names_for_bidder_address(
    conn: &mut SqliteConnection,
    address: &str,
    page: Option<usize>,
    page_size: usize,
    sort: SortOrder,
) -> Result<Vec<String>> {
    let bidder = bidders::table
        .filter(bidders::address.eq(address))
        .select(Bidder::as_select())
        .get_result(conn)
        .optional()?;

    let bidder = match bidder {
        Some(bidder) => bidder,
        // Just return an empty vector if the bidder was not found
        None => return Ok(vec![]),
    };

    let mut query = Bid::belonging_to(&bidder)
        .inner_join(names::table)
        .group_by(names::id)
        .select(names::name)
        .limit(page_size as _)
        .offset((page.unwrap_or_default() * page_size) as _)
        .into_boxed();

    query = match sort {
        SortOrder::Asc => query.order(names::name.asc()),
        SortOrder::Desc => query.order(names::name.desc()),
    };

    Ok(query.load(conn)?)
}

pub fn get_total_auctions(conn: &mut SqliteConnection, search: Option<String>) -> Result<i64> {
    let mut query = names::table.count().into_boxed();
    if let Some(search) = search {
        query = query.filter(names::name.like(format!("%{search}%")))
    }

    Ok(query.get_result::<(i64,)>(conn)?)
}

pub fn get_auctions(
    conn: &mut SqliteConnection,
    page: Option<usize>,
    page_size: usize,
    sort: SortOrder,
    sort_by: AuctionSortBy,
    search: Option<String>,
) -> Result<Vec<String>> {
    let mut query = names::table
        .inner_join(bids::table)
        .group_by(names::id)
        .select((Name::as_select(), dsl::max(bids::bid)))
        .limit(page_size as _)
        .offset((page.unwrap_or_default() * page_size) as _)
        .into_boxed();
    if let Some(search) = search {
        query = query.filter(names::name.like(format!("%{search}%")))
    }
    query = match (sort, sort_by) {
        (SortOrder::Asc, AuctionSortBy::Name) => query.order(names::name.asc()),
        (SortOrder::Desc, AuctionSortBy::Name) => query.order(names::name.desc()),
        (SortOrder::Asc, AuctionSortBy::Bid) => {
            query.order((dsl::max(bids::bid).asc(), names::id.asc()))
        }
        (SortOrder::Desc, AuctionSortBy::Bid) => {
            query.order((dsl::max(bids::bid).desc(), names::id.desc()))
        }
    };

    Ok(query
        .load::<(Name, Option<i64>)>(conn)?
        .into_iter()
        .map(|(name, _)| name.name)
        .collect())
}

pub fn get_bid_count(conn: &mut SqliteConnection, name_str: &str) -> Result<i64> {
    Ok(names::table
        .inner_join(bids::table)
        .group_by(names::id)
        .select(dsl::count(bids::bid))
        .filter(names::name.eq(name_str))
        .get_result(conn)
        .optional()?
        .unwrap_or_default())
}
