// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use diesel::{Associations, Identifiable, Queryable, Selectable};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BlockMatchType {
    Full,
    Substring,
}

impl BlockMatchType {
    pub fn as_str(&self) -> &'static str {
        match self {
            BlockMatchType::Full => "full",
            BlockMatchType::Substring => "substring",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "full" => Some(BlockMatchType::Full),
            "substring" => Some(BlockMatchType::Substring),
            _ => None,
        }
    }
}

#[derive(Queryable, Selectable, Identifiable, PartialEq, Debug)]
#[diesel(table_name = names)]
pub struct Name {
    pub id: i32,
    pub name: String,
    pub blocked: bool,
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
#[diesel(table_name = bids)]
#[diesel(primary_key(name_id, bidder_id, bid))]
pub struct Bid {
    pub bidder_id: i32,
    pub name_id: i32,
    pub bid: i64,
}

#[derive(Identifiable, Selectable, Queryable, Associations, Debug)]
#[diesel(belongs_to(Name))]
#[diesel(table_name = auctions)]
#[diesel(primary_key(name_id))]
pub struct Auction {
    pub name_id: i32,
    pub expiration_timestamp: i64,
    pub claimed: bool,
}

#[derive(Queryable, Selectable, Identifiable, PartialEq, Debug)]
#[diesel(table_name = blocked_strings)]
pub struct BlockedString {
    pub id: i32,
    pub blocked_string: String,
    pub match_type: String,
}

#[derive(diesel::Insertable)]
#[diesel(table_name = blocked_strings)]
pub struct NewBlockedString<'a> {
    pub blocked_string: &'a str,
    pub match_type: &'a str,
}

diesel::table! {
    names (id) {
        id -> Int4,
        name -> Text,
        blocked -> Bool,
    }
}

diesel::table! {
    bidders (id) {
        id -> Int4,
        address -> Text,
    }
}

diesel::table! {
    bids (name_id, bidder_id, bid) {
        bidder_id -> Int4,
        name_id -> Int4,
        bid -> Int8,
    }
}

diesel::table! {
    name_bids (name_id) {
        name_id -> Int4,
        bids -> Int4,
    }
}

diesel::table! {
    auctions (name_id) {
        name_id -> Int4,
        expiration_timestamp -> Int8,
        claimed -> Bool
    }
}

diesel::joinable!(bids -> names (name_id));
diesel::joinable!(bids -> bidders (bidder_id));
diesel::joinable!(auctions -> names (name_id));

diesel::table! {
    blocked_strings (id) {
        id -> Integer,
        blocked_string -> Text,
        match_type -> Text,
    }
}

diesel::allow_tables_to_appear_in_same_query!(auctions, bidders, bids, blocked_strings, names,);
