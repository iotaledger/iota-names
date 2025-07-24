// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use anyhow::Result;
use diesel::{
    BelongingToDsl, ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper,
    SqliteConnection, TextExpressionMethods, delete, insert_into,
};

use super::models::{Bidder, BidderName, Name, bidder_name, bidders, name_bids, names};
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

pub fn create_bidder_name_relationship(
    conn: &mut SqliteConnection,
    bidder_id: i32,
    name_id: i32,
    bid: u64,
) -> Result<()> {
    insert_into(bidder_name::table)
        .values((
            bidder_name::bidder_id.eq(bidder_id),
            bidder_name::name_id.eq(name_id),
            bidder_name::bid.eq(bid as f64),
        ))
        .on_conflict_do_nothing()
        .execute(conn)?;
    Ok(())
}

pub fn add_bidder_name_entry(
    conn: &mut SqliteConnection,
    bidder_address: &str,
    name_str: &str,
    bid: u64,
) -> Result<()> {
    let bidder = get_or_create_bidder(conn, bidder_address)?;
    let name = get_or_create_name(conn, name_str)?;
    create_bidder_name_relationship(conn, bidder.id, name.id, bid)
}

pub fn get_names_for_bidder_address(
    conn: &mut SqliteConnection,
    address: &str,
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

    let names = BidderName::belonging_to(&bidder)
        .inner_join(names::table)
        .select(Name::as_select())
        .load(conn)?;

    Ok(names.into_iter().map(|d| d.name).collect())
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
        .inner_join(bidder_name::table)
        .group_by(names::id)
        .select((names::name, diesel::dsl::max(bidder_name::bid)))
        .limit(page_size as _)
        .offset((page.unwrap_or_default() * page_size) as _)
        .into_boxed();
    if let Some(search) = search {
        query = query.filter(names::name.like(format!("%{search}%")))
    }
    query = match (sort, sort_by) {
        (SortOrder::Asc, AuctionSortBy::Name) => query.order(names::name.asc()),
        (SortOrder::Desc, AuctionSortBy::Name) => query.order(names::name.desc()),
        (SortOrder::Asc, AuctionSortBy::Bid) => query.order(bidder_name::bid.asc()),
        (SortOrder::Desc, AuctionSortBy::Bid) => query.order(bidder_name::bid.desc()),
    };
    Ok(query
        .load::<(String, Option<f64>)>(conn)?
        .into_iter()
        .map(|v| v.0)
        .collect())
}

pub fn upsert_name_bids_entry(conn: &mut SqliteConnection, name_str: &str) -> Result<()> {
    let name = get_or_create_name(conn, name_str)?;
    insert_into(name_bids::table)
        .values((name_bids::name_id.eq(name.id), name_bids::bids.eq(1)))
        .on_conflict(name_bids::name_id)
        .do_update()
        .set(name_bids::bids.eq(name_bids::bids + 1))
        .execute(conn)?;
    Ok(())
}

pub fn remove_name_bids_entry(conn: &mut SqliteConnection, name_str: &str) -> Result<i32> {
    let name = get_or_create_name(conn, name_str)?;
    let bid_count = name_bids::table
        .find(name.id)
        .select(name_bids::bids)
        .first(conn)?;

    delete(name_bids::table.find(name.id)).execute(conn)?;

    Ok(bid_count)
}
