// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use anyhow::Result;
use chrono::{DateTime, Utc};
use diesel::{
    ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper,
    SqliteConnection, TextExpressionMethods, dsl, insert_into, update,
};

use crate::db::{
    AuctionSortBy, AuctionStatus, SortOrder,
    models::{
        Bidder, BlockMatchType, BlockedString, Name, NewBlockedString, auctions, bidders, bids,
        blocked_strings, names,
    },
};

fn is_name_blocked(name: &str, blocked_strings: &[BlockedString]) -> bool {
    for blocked in blocked_strings {
        let match_type =
            BlockMatchType::from_str(&blocked.match_type).unwrap_or(BlockMatchType::Substring);
        match match_type {
            BlockMatchType::Full => {
                if name == blocked.blocked_string {
                    return true;
                }
            }
            BlockMatchType::Substring => {
                if name.contains(&blocked.blocked_string) {
                    return true;
                }
            }
        }
    }
    false
}

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
    let blocked_strings = get_blocked_strings_detailed(conn)?;
    let is_blocked = is_name_blocked(name, &blocked_strings);

    let maybe_name = insert_into(names::table)
        .values((names::name.eq(name), names::blocked.eq(is_blocked)))
        .on_conflict(names::name)
        .do_update()
        .set(names::blocked.eq(is_blocked))
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
    bidder: &Bidder,
    name: &Name,
    bid: u64,
) -> Result<()> {
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

pub fn upsert_auctions_entry(
    conn: &mut SqliteConnection,
    name: &Name,
    expiration_timestamp: i64,
) -> Result<()> {
    insert_into(auctions::table)
        .values((
            auctions::name_id.eq(name.id),
            auctions::expiration_timestamp.eq(expiration_timestamp),
            auctions::claimed.eq(false),
        ))
        .on_conflict(auctions::name_id)
        .do_update()
        .set(auctions::expiration_timestamp.eq(expiration_timestamp))
        .execute(conn)?;
    Ok(())
}

pub fn claim_auctions_entry(conn: &mut SqliteConnection, name: &Name) -> Result<()> {
    update(auctions::table.filter(auctions::name_id.eq(name.id)))
        .set((auctions::claimed.eq(true),))
        .execute(conn)?;
    Ok(())
}

pub fn get_bidder_by_address(conn: &mut SqliteConnection, address: &str) -> Result<Option<Bidder>> {
    Ok(bidders::table
        .filter(bidders::address.eq(address))
        .select(Bidder::as_select())
        .get_result(conn)
        .optional()?)
}

pub fn get_auctions_for_bidder(
    conn: &mut SqliteConnection,
    bidder_id: i32,
    page: Option<usize>,
    page_size: usize,
    sort: SortOrder,
    status: Option<AuctionStatus>,
    now: DateTime<Utc>,
) -> Result<Vec<String>> {
    let mut query = names::table
        .inner_join(bids::table)
        .inner_join(auctions::table)
        .group_by(names::id)
        .select(names::name)
        .filter(bids::bidder_id.eq(bidder_id))
        .filter(names::blocked.eq(false)) // Filter out blocked names using the boolean field
        .into_boxed();

    if let Some(status) = status {
        query = match status {
            AuctionStatus::Active => {
                query.filter(auctions::expiration_timestamp.gt(now.timestamp_millis()))
            }
            AuctionStatus::Finished => {
                query.filter(auctions::expiration_timestamp.le(now.timestamp_millis()))
            }
            AuctionStatus::Claimed => query.filter(auctions::claimed.eq(true)),
        };
    }

    query = match sort {
        SortOrder::Asc => query.order(names::name.asc()),
        SortOrder::Desc => query.order(names::name.desc()),
    };

    Ok(query
        .limit(page_size as _)
        .offset((page.unwrap_or_default() * page_size) as _)
        .load(conn)?)
}

pub fn get_auctions_for_bidder_count(
    conn: &mut SqliteConnection,
    bidder_id: i32,
    status: Option<AuctionStatus>,
    now: DateTime<Utc>,
) -> Result<usize> {
    let mut query = names::table
        .inner_join(bids::table)
        .inner_join(auctions::table)
        .select(names::name)
        .distinct()
        .filter(bids::bidder_id.eq(bidder_id))
        .filter(names::blocked.eq(false)) // Filter out blocked names using the boolean field
        .into_boxed();

    if let Some(status) = status {
        query = match status {
            AuctionStatus::Active => {
                query.filter(auctions::expiration_timestamp.gt(now.timestamp_millis()))
            }
            AuctionStatus::Finished => {
                query.filter(auctions::expiration_timestamp.le(now.timestamp_millis()))
            }
            AuctionStatus::Claimed => query.filter(auctions::claimed.eq(true)),
        };
    }

    let count = query.load::<String>(conn)?.len();
    Ok(count)
}

#[expect(clippy::too_many_arguments)]
pub fn get_auctions(
    conn: &mut SqliteConnection,
    page: Option<usize>,
    page_size: usize,
    sort: SortOrder,
    sort_by: AuctionSortBy,
    search: Option<&str>,
    status: Option<AuctionStatus>,
    now: DateTime<Utc>,
) -> Result<Vec<String>> {
    let mut query = names::table
        .inner_join(bids::table)
        .inner_join(auctions::table)
        .group_by(names::id)
        .select((Name::as_select(), dsl::max(bids::bid)))
        .filter(names::blocked.eq(false)) // Filter out blocked names using the boolean field
        .into_boxed();
    if let Some(search) = search {
        query = query.filter(names::name.like(format!("%{search}%")))
    }
    if let Some(status) = status {
        query = match status {
            AuctionStatus::Active => {
                query.filter(auctions::expiration_timestamp.gt(now.timestamp_millis()))
            }
            AuctionStatus::Finished => {
                query.filter(auctions::expiration_timestamp.le(now.timestamp_millis()))
            }
            AuctionStatus::Claimed => query.filter(auctions::claimed.eq(true)),
        };
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
        .limit(page_size as _)
        .offset((page.unwrap_or_default() * page_size) as _)
        .load::<(Name, Option<i64>)>(conn)?
        .into_iter()
        .map(|(name, _)| name.name)
        .collect())
}

pub fn get_auctions_count(
    conn: &mut SqliteConnection,
    search: Option<&str>,
    status: Option<AuctionStatus>,
    now: DateTime<Utc>,
) -> Result<usize> {
    let mut query = names::table
        .inner_join(bids::table)
        .inner_join(auctions::table)
        .select(names::name)
        .distinct()
        .filter(names::blocked.eq(false)) // Filter out blocked names using the boolean field
        .into_boxed();

    if let Some(status) = status {
        query = match status {
            AuctionStatus::Active => {
                query.filter(auctions::expiration_timestamp.gt(now.timestamp_millis()))
            }
            AuctionStatus::Finished => {
                query.filter(auctions::expiration_timestamp.le(now.timestamp_millis()))
            }
            AuctionStatus::Claimed => query.filter(auctions::claimed.eq(true)),
        };
    }

    if let Some(search) = search {
        query = query.filter(names::name.like(format!("%{search}%")))
    }

    let count = query.load::<String>(conn)?.len();
    Ok(count)
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

pub fn add_blocked_string(
    conn: &mut SqliteConnection,
    string: &str,
    match_type: BlockMatchType,
) -> Result<()> {
    let new_blocked_string = NewBlockedString {
        blocked_string: string,
        match_type: match_type.as_str(),
    };

    insert_into(blocked_strings::table)
        .values(&new_blocked_string)
        .execute(conn)?;

    update_existing_names_blocked_status(conn)?;

    Ok(())
}

pub fn remove_blocked_string(conn: &mut SqliteConnection, string: &str) -> Result<bool> {
    use diesel::delete;

    let deleted_count =
        delete(blocked_strings::table.filter(blocked_strings::blocked_string.eq(string)))
            .execute(conn)?;

    if deleted_count > 0 {
        update_existing_names_blocked_status(conn)?;
    }

    Ok(deleted_count > 0)
}

pub fn get_blocked_strings(conn: &mut SqliteConnection) -> Result<Vec<String>> {
    blocked_strings::table
        .select(blocked_strings::blocked_string)
        .load::<String>(conn)
        .map_err(Into::into)
}

pub fn get_blocked_strings_detailed(conn: &mut SqliteConnection) -> Result<Vec<BlockedString>> {
    blocked_strings::table
        .select(BlockedString::as_select())
        .load::<BlockedString>(conn)
        .map_err(Into::into)
}

pub fn update_existing_names_blocked_status(conn: &mut SqliteConnection) -> Result<()> {
    let blocked_strings = get_blocked_strings_detailed(conn)?;
    let all_names = names::table.select(Name::as_select()).load::<Name>(conn)?;

    for name in all_names {
        let should_be_blocked = is_name_blocked(&name.name, &blocked_strings);
        if name.blocked != should_be_blocked {
            update(names::table.filter(names::id.eq(name.id)))
                .set(names::blocked.eq(should_be_blocked))
                .execute(conn)?;
        }
    }

    Ok(())
}
