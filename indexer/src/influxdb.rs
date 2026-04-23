// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::fmt::Write;

use reqwest::Client;
use tracing::{debug, warn};

use crate::events::{CouponKind, IotaNamesEvent};

/// InfluxDB v2 client for writing event data with actual on-chain timestamps.
pub(crate) struct InfluxDb {
    client: Client,
    write_url: String,
    token: String,
}

impl InfluxDb {
    pub fn new(url: &str, token: &str, org: &str, bucket: &str) -> Self {
        let url = url.trim_end_matches('/');
        let write_url = format!(
            "{url}/api/v2/write?org={org}&bucket={bucket}&precision=ms",
        );
        Self {
            client: Client::new(),
            write_url,
            token: token.to_string(),
        }
    }

    /// Write all events from a checkpoint to InfluxDB.
    ///
    /// `timestamp_ms` is the checkpoint's on-chain timestamp in milliseconds.
    pub async fn write_events(
        &self,
        events: &[(IotaNamesEvent, u64)],
        balance_updates: &[BalanceUpdate],
    ) {
        let mut body = String::new();

        for (event, timestamp_ms) in events {
            if let Err(e) = write_event_line(&mut body, event, *timestamp_ms) {
                warn!("Failed to format InfluxDB line for event {event:?}: {e}");
            }
        }

        for update in balance_updates {
            let _ = writeln!(
                body,
                "balance,source={} value={}i {}",
                update.source, update.value, update.timestamp_ms,
            );
        }

        if body.is_empty() {
            return;
        }

        debug!("Writing {} bytes to InfluxDB", body.len());

        if let Err(e) = self
            .client
            .post(&self.write_url)
            .header("Authorization", format!("Token {}", self.token))
            .header("Content-Type", "text/plain; charset=utf-8")
            .body(body)
            .send()
            .await
            .and_then(|r| r.error_for_status())
        {
            warn!("Failed to write to InfluxDB: {e}");
        }
    }
}

pub(crate) struct BalanceUpdate {
    pub source: &'static str,
    pub value: i64,
    pub timestamp_ms: u64,
}

/// Escape a string value for InfluxDB line protocol tag values.
/// Tags: escape commas, equals, spaces.
fn escape_tag(s: &str) -> String {
    s.replace(',', r"\,")
        .replace('=', r"\=")
        .replace(' ', r"\ ")
}

/// Escape a string value for InfluxDB line protocol field values (quoted strings).
/// Inside double quotes: escape double quotes and backslashes.
fn escape_field_str(s: &str) -> String {
    s.replace('\\', r"\\").replace('"', r#"\""#)
}

fn write_event_line(
    buf: &mut String,
    event: &IotaNamesEvent,
    timestamp_ms: u64,
) -> std::fmt::Result {
    match event {
        IotaNamesEvent::AuctionStarted(e) => {
            writeln!(
                buf,
                "auction_started name=\"{}\",starting_bid={}i,bidder=\"{}\",start_timestamp_ms={}i,end_timestamp_ms={}i {}",
                escape_field_str(&e.name.to_string()),
                e.starting_bid,
                e.bidder,
                e.start_timestamp_ms,
                e.end_timestamp_ms,
                timestamp_ms,
            )
        }
        IotaNamesEvent::AuctionBid(e) => {
            writeln!(
                buf,
                "auction_bid name=\"{}\",bid={}i,bidder=\"{}\" {}",
                escape_field_str(&e.name.to_string()),
                e.bid,
                e.bidder,
                timestamp_ms,
            )
        }
        IotaNamesEvent::AuctionExtended(e) => {
            writeln!(
                buf,
                "auction_extended name=\"{}\",end_timestamp_ms={}i {}",
                escape_field_str(&e.name.to_string()),
                e.end_timestamp_ms,
                timestamp_ms,
            )
        }
        IotaNamesEvent::AuctionFinalized(e) => {
            writeln!(
                buf,
                "auction_finalized name=\"{}\",winning_bid={}i,winner=\"{}\",duration_ms={}i {}",
                escape_field_str(&e.name.to_string()),
                e.winning_bid,
                e.winner,
                e.end_timestamp_ms.saturating_sub(e.start_timestamp_ms),
                timestamp_ms,
            )
        }
        IotaNamesEvent::CouponApplied(e) => {
            let kind = match e.kind {
                CouponKind::Percentage => "percentage",
                CouponKind::Fixed => "fixed",
            };
            writeln!(
                buf,
                "coupon_applied,kind={kind} discount={}i {}",
                e.discount, timestamp_ms,
            )
        }
        IotaNamesEvent::NameRecordAdded(e) => {
            let sln_length = e.name.label(1).expect("missing SLN").len();
            let depth = e.name.num_labels();
            writeln!(
                buf,
                "name_record_added name=\"{}\",length={}i,depth={}i {}",
                escape_field_str(&e.name.to_string()),
                sln_length,
                depth,
                timestamp_ms,
            )
        }
        IotaNamesEvent::NameRecordRemoved(e) => {
            let sln_length = e.name.label(1).expect("missing SLN").len();
            let depth = e.name.num_labels();
            writeln!(
                buf,
                "name_record_removed name=\"{}\",length={}i,depth={}i {}",
                escape_field_str(&e.name.to_string()),
                sln_length,
                depth,
                timestamp_ms,
            )
        }
        IotaNamesEvent::TargetAddressSet(e) => {
            let set = e.target_address.is_some();
            writeln!(
                buf,
                "target_address_set name=\"{}\",set={set} {}",
                escape_field_str(&e.name.to_string()),
                timestamp_ms,
            )
        }
        IotaNamesEvent::ReverseLookupSet(e) => {
            writeln!(
                buf,
                "reverse_lookup_set address=\"{}\",name=\"{}\" {}",
                e.default_address,
                escape_field_str(&e.default_name.to_string()),
                timestamp_ms,
            )
        }
        IotaNamesEvent::ReverseLookupUnset(e) => {
            writeln!(
                buf,
                "reverse_lookup_unset address=\"{}\",name=\"{}\" {}",
                e.default_address,
                escape_field_str(&e.default_name.to_string()),
                timestamp_ms,
            )
        }
        IotaNamesEvent::UserDataSet(e) => {
            writeln!(
                buf,
                "user_data_set,key={} value=\"{}\",new={} {}",
                escape_tag(&e.key),
                escape_field_str(&e.value),
                e.new,
                timestamp_ms,
            )
        }
        IotaNamesEvent::UserDataUnset(e) => {
            writeln!(
                buf,
                "user_data_unset,key={} count=1i {}",
                escape_tag(&e.key),
                timestamp_ms,
            )
        }
        IotaNamesEvent::Transaction(e) => {
            writeln!(
                buf,
                "transaction,app={},is_renewal={} name=\"{}\",years={}i,base_amount={}i,currency=\"{}\",currency_amount={}i {}",
                escape_tag(&e.app),
                e.is_renewal,
                escape_field_str(&e.name.to_string()),
                e.years,
                e.base_amount,
                escape_field_str(&e.currency),
                e.currency_amount,
                timestamp_ms,
            )
        }
        IotaNamesEvent::NodeSubnameCreated(e) => {
            writeln!(
                buf,
                "node_subname_created name=\"{}\",expiration_timestamp_ms={}i {}",
                escape_field_str(&e.name.to_string()),
                e.expiration_timestamp_ms,
                timestamp_ms,
            )
        }
        IotaNamesEvent::NodeSubnameBurned(e) => {
            writeln!(
                buf,
                "node_subname_burned name=\"{}\" {}",
                escape_field_str(&e.name.to_string()),
                timestamp_ms,
            )
        }
        IotaNamesEvent::LeafSubnameCreated(e) => {
            writeln!(
                buf,
                "leaf_subname_created name=\"{}\",target=\"{}\" {}",
                escape_field_str(&e.name.to_string()),
                e.target,
                timestamp_ms,
            )
        }
        IotaNamesEvent::LeafSubnameRemoved(e) => {
            writeln!(
                buf,
                "leaf_subname_removed name=\"{}\" {}",
                escape_field_str(&e.name.to_string()),
                timestamp_ms,
            )
        }
    }
}
