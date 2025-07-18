// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use diesel::{Associations, Identifiable, Queryable, Selectable};

#[derive(Queryable, Selectable, Identifiable, PartialEq, Debug)]
#[diesel(table_name = names)]
pub struct Name {
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
#[diesel(belongs_to(Name))]
#[diesel(table_name = bidder_name)]
#[diesel(primary_key(bidder_id, name_id))]
pub struct BidderName {
    pub bidder_id: i32,
    pub name_id: i32,
}

#[derive(Identifiable, Selectable, Queryable, Associations, Debug)]
#[diesel(belongs_to(Name))]
#[diesel(table_name = name_bids)]
#[diesel(primary_key(name_id))]
pub struct NameBids {
    pub name_id: i32,
    pub bids: i32,
}

diesel::table! {
    names (id) {
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
    bidder_name (bidder_id, name_id) {
        bidder_id -> Int4,
        name_id -> Int4,
    }
}

diesel::table! {
    name_bids (name_id) {
        name_id -> Int4,
        bids -> Int4,
    }
}

diesel::joinable!(bidder_name -> names (name_id));
diesel::joinable!(bidder_name -> bidders (bidder_id));
diesel::joinable!(name_bids -> names (name_id));

diesel::allow_tables_to_appear_in_same_query!(bidders, names, bidder_name);
diesel::allow_tables_to_appear_in_same_query!(names, name_bids);
