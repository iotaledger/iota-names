// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use diesel::prelude::*;
use iota_types::base_types::IotaAddress;

use crate::db::{bidder_domain, bidders, domains};

#[derive(Queryable, Selectable, Identifiable, PartialEq, Debug)]
#[diesel(table_name = domains)]
pub struct Domain {
    pub id: i32,
    pub name: String,
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

#[derive(Queryable, Selectable, Identifiable, PartialEq, Debug)]
#[diesel(table_name = bidders)]
pub struct Bidder {
    pub id: i32,
    pub address: String,
}
