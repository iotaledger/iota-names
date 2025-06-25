// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use diesel::{Associations, Identifiable, Queryable, Selectable};

#[derive(Queryable, Selectable, Identifiable, PartialEq, Debug)]
#[diesel(table_name = domains)]
pub struct Domain {
    pub id: i32,
    pub name: String,
}

#[derive(Queryable, Selectable, Identifiable, PartialEq, Debug)]
#[diesel(table_name = bidders)]
pub struct Bidder {
    pub id: i32,
    pub address: String,
}

#[derive(Identifiable, Selectable, Queryable, Associations, Debug)]
#[diesel(belongs_to(Bidder))]
#[diesel(belongs_to(Domain))]
#[diesel(table_name = bidder_domain)]
#[diesel(primary_key(bidder_id, domain_id))]
pub struct BidderDomain {
    pub bidder_id: i32,
    pub domain_id: i32,
}

#[derive(Identifiable, Selectable, Queryable, Associations, Debug)]
#[diesel(belongs_to(Domain))]
#[diesel(table_name = domain_bids)]
#[diesel(primary_key(domain_id))]
pub struct DomainBids {
    pub domain_id: i32,
    pub bids: i32,
}

diesel::table! {
    domains (id) {
        id -> Int4,
        name -> Text,
    }
}

diesel::table! {
    bidders (id) {
        id -> Int4,
        address -> Text,
    }
}

diesel::table! {
    bidder_domain (bidder_id, domain_id) {
        bidder_id -> Int4,
        domain_id -> Int4,
    }
}

diesel::table! {
    domain_bids (domain_id) {
        domain_id -> Int4,
        bids -> Int4,
    }
}

diesel::joinable!(bidder_domain -> domains (domain_id));
diesel::joinable!(bidder_domain -> bidders (bidder_id));
diesel::joinable!(domain_bids -> domains (domain_id));

diesel::allow_tables_to_appear_in_same_query!(bidders, domains, bidder_domain);
