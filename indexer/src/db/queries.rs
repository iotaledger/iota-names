// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use anyhow::Result;
use diesel::{
    BelongingToDsl, ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper,
    SqliteConnection, insert_into,
};

use super::models::{Bidder, BidderDomain, Domain, bidder_domain, bidders, domains};

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

pub fn get_or_create_domain(conn: &mut SqliteConnection, name: &str) -> Result<Domain> {
    let maybe_domain = insert_into(domains::table)
        .values(domains::name.eq(name))
        .on_conflict_do_nothing()
        .returning(Domain::as_returning())
        .get_result(conn)
        .optional()?;

    match maybe_domain {
        Some(domain) => Ok(domain),
        None => domains::table
            .filter(domains::name.eq(name))
            .first::<Domain>(conn)
            .map_err(Into::into),
    }
}

pub fn create_bidder_domain_relationship(
    conn: &mut SqliteConnection,
    bidder_id: i32,
    domain_id: i32,
) -> Result<()> {
    insert_into(bidder_domain::table)
        .values((
            bidder_domain::bidder_id.eq(bidder_id),
            bidder_domain::domain_id.eq(domain_id),
        ))
        .on_conflict_do_nothing()
        .execute(conn)?;
    Ok(())
}

pub fn add_bidder_domain_entry(
    conn: &mut SqliteConnection,
    bidder_address: &str,
    domain_name: &str,
) -> Result<()> {
    let bidder = get_or_create_bidder(conn, bidder_address)?;
    let domain = get_or_create_domain(conn, domain_name)?;
    create_bidder_domain_relationship(conn, bidder.id, domain.id)?;
    Ok(())
}

pub fn get_domains_for_bidder_address(
    conn: &mut SqliteConnection,
    address: &str,
) -> Result<Vec<String>> {
    let bidder = bidders::table
        .filter(bidders::address.eq(address))
        .select(Bidder::as_select())
        .get_result(conn)?;

    let domains = BidderDomain::belonging_to(&bidder)
        .inner_join(domains::table)
        .select(Domain::as_select())
        .load(conn)?;

    Ok(domains.into_iter().map(|d| d.name).collect())
}
