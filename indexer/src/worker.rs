// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::{panic::AssertUnwindSafe, path::PathBuf, str::FromStr, sync::Arc};

use anyhow::{Result, anyhow};
use async_trait::async_trait;
use diesel::Connection;
use futures::FutureExt;
use iota_data_ingestion_core::{
    DataIngestionMetrics, FileProgressStore, IndexerExecutor, ReaderOptions, Worker, WorkerPool,
};
use iota_json::IotaJsonValue;
use iota_names::domain::Domain;
use iota_types::{
    Identifier, TypeTag,
    balance::Balance,
    base_types::ObjectID,
    collection_types::LinkedTable,
    dynamic_field::Field,
    effects::{TransactionEffects, TransactionEffectsAPI},
    execution_status::ExecutionStatus,
    full_checkpoint_content::CheckpointData,
    object::Object,
    transaction::{ProgrammableTransaction, TransactionData, TransactionKind},
};
use move_core_types::{
    annotated_value::{MoveFieldLayout, MoveStructLayout, MoveTypeLayout},
    language_storage::StructTag,
};
use prometheus::Registry;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, warn};

use crate::{
    IotaNamesMetrics,
    config::IotaNamesExtendedConfig,
    db::{
        pool::DbConnectionPool,
        queries::{add_bidder_domain_entry, remove_domain_bids_entry, upsert_domain_bids_entry},
    },
    events::{CouponKind, IotaNamesEvent},
};

pub(crate) async fn run_iota_names_reader(
    worker: IotaNamesWorker,
    node_url: &str,
    registry: &Registry,
    concurrency: usize,
) -> anyhow::Result<()> {
    let progress_store = FileProgressStore::new("./progress_store").await?;

    let mut executor = IndexerExecutor::new(
        progress_store,
        1,
        DataIngestionMetrics::new(registry),
        worker.token.clone(),
    );
    let worker_pool = WorkerPool::new(
        worker,
        "iota_names_reader".to_string(),
        concurrency,
        Default::default(),
    );
    executor.register(worker_pool).await?;

    info!("Connecting to node at {node_url}");
    executor
        .run(
            // path to a local directory where checkpoints are stored.
            PathBuf::from("./chk"),
            Some(format!("{node_url}/api/v1")),
            // optional remote store access options.
            vec![],
            ReaderOptions::default(),
        )
        .await?;
    Ok(())
}

pub(crate) struct IotaNamesWorker {
    pool: DbConnectionPool,
    extended_config: IotaNamesExtendedConfig,
    metrics: Arc<IotaNamesMetrics>,
    token: CancellationToken,
    balance_object_id: ObjectID,
}

impl IotaNamesWorker {
    pub(crate) fn new(
        pool: DbConnectionPool,
        extended_config: IotaNamesExtendedConfig,
        metrics: Arc<IotaNamesMetrics>,
        token: CancellationToken,
    ) -> anyhow::Result<Self> {
        let config_type = StructTag::from_str(&format!(
            "{}::iota_names::BalanceKey<0x2::iota::IOTA>",
            extended_config.iota_names_config.package_address,
        ))?;
        let layout = MoveTypeLayout::Struct(Box::new(MoveStructLayout {
            type_: config_type.clone(),
            fields: vec![MoveFieldLayout::new(
                Identifier::from_str("dummy_field")?,
                MoveTypeLayout::Bool,
            )],
        }));
        let balance_object_id = iota_types::dynamic_field::derive_dynamic_field_id(
            extended_config.iota_names_config.object_id,
            &TypeTag::Struct(Box::new(config_type)),
            &IotaJsonValue::new(serde_json::json!({ "dummy_field": false }))?
                .to_bcs_bytes(&layout)?,
        )?;

        Ok(Self {
            pool,
            extended_config,
            metrics,
            token,
            balance_object_id,
        })
    }

    fn process_event(&self, event: IotaNamesEvent) -> anyhow::Result<()> {
        match event {
            // `auctions`
            IotaNamesEvent::AuctionStarted(event) => {
                self.metrics.total_auction_started.inc();
                let mut conn = self.pool.get_connection()?;
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    add_bidder_domain_entry(
                        conn,
                        &event.bidder.to_string(),
                        &event.domain.to_string(),
                    )?;
                    upsert_domain_bids_entry(conn, &event.domain.to_string())
                })?;
            }
            IotaNamesEvent::AuctionBid(event) => {
                let mut conn = self.pool.get_connection()?;
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    add_bidder_domain_entry(
                        conn,
                        &event.bidder.to_string(),
                        &event.domain.to_string(),
                    )?;
                    upsert_domain_bids_entry(conn, &event.domain.to_string())
                })?;
            }
            IotaNamesEvent::AuctionExtended(_event) => (),
            IotaNamesEvent::AuctionFinalized(event) => {
                self.metrics.total_auction_finalized.inc();
                self.metrics.auction_final_prices.observe(event.winning_bid);
                self.metrics
                    .auction_durations
                    .observe(event.end_timestamp_ms - event.start_timestamp_ms);
                let mut conn = self.pool.get_connection()?;
                let bid_count = conn.transaction::<_, anyhow::Error, _>(|conn| {
                    remove_domain_bids_entry(conn, &event.domain.to_string())
                })?;
                self.metrics
                    .auction_bid_count_distribution
                    .with_label_values(&[&bid_count.to_string()])
                    .inc();
            }
            // `coupons`
            IotaNamesEvent::CouponApplied(event) => match event.kind {
                CouponKind::Percentage => self
                    .metrics
                    .total_percentage_discount
                    .add(event.discount as _),
                CouponKind::Fixed => self.metrics.total_fixed_discount.add(event.discount as _),
            },
            // `iota-names`
            IotaNamesEvent::NameRecordAdded(event) => {
                self.metrics.total_name_records_added.inc();

                let sld_length = event.domain.label(1).expect("missing SLD").len();
                self.metrics
                    .name_length_distribution
                    .with_label_values(&[&sld_length.to_string()])
                    .inc();

                let depth = event.domain.num_labels();
                self.metrics
                    .name_depth_distribution
                    .with_label_values(&[&depth.to_string()])
                    .inc();
            }
            IotaNamesEvent::NameRecordRemoved(event) => {
                self.metrics.total_name_records_removed.inc();

                let sld_length = event.domain.label(1).expect("missing SLD").len();
                self.metrics
                    .name_length_distribution
                    .with_label_values(&[&sld_length.to_string()])
                    .dec();

                let depth = event.domain.num_labels();
                self.metrics
                    .name_depth_distribution
                    .with_label_values(&[&depth.to_string()])
                    .dec();
            }
            IotaNamesEvent::TargetAddressSet(event) => {
                if event.target_address.is_some() {
                    self.metrics.total_target_address.inc()
                } else {
                    self.metrics.total_target_address.dec()
                }
            }
            IotaNamesEvent::ReverseLookupSet(_event) => self.metrics.total_default_name.inc(),
            IotaNamesEvent::ReverseLookupUnset(_event) => self.metrics.total_default_name.dec(),
            IotaNamesEvent::UserDataSet(event) => {
                if event.new {
                    self.metrics
                        .user_data_distribution
                        .with_label_values(&[&event.key])
                        .inc();
                }
            }
            IotaNamesEvent::UserDataUnset(event) => {
                self.metrics
                    .user_data_distribution
                    .with_label_values(&[&event.key])
                    .dec();
            }
            IotaNamesEvent::Transaction(event) => {
                if event.is_renewal {
                    self.metrics
                        .renewal_years_distribution
                        .with_label_values(&[event.years.to_string()])
                        .inc();
                }
            }
            // `subdomains`
            IotaNamesEvent::NodeSubdomainCreated(_event) => {
                self.metrics.total_node_subdomains.inc();
            }
            IotaNamesEvent::NodeSubdomainBurned(_event) => {
                self.metrics.total_node_subdomains.dec();
            }
            IotaNamesEvent::LeafSubdomainCreated(_event) => {
                self.metrics.total_leaf_subdomains.inc();
            }
            IotaNamesEvent::LeafSubdomainRemoved(_event) => {
                self.metrics.total_leaf_subdomains.dec();
            }
        }

        Ok(())
    }

    fn process_ptb(&self, _ptb: &ProgrammableTransaction) -> anyhow::Result<()> {
        let _module = Identifier::new("payment")?; // TODO: Make const
        let _function = Identifier::new("register")?;

        // if ptb.commands.iter().any(|cmd| {
        //     if let Command::MoveCall(call) = cmd {
        //         call.package == ObjectID::from(self.config.package_address)
        //             && call.module == module
        //             && call.function == function
        //     } else {
        //         false
        //     }
        // }) {}

        Ok(())
    }

    async fn process_checkpoint(&self, checkpoint: &CheckpointData) -> anyhow::Result<()> {
        debug!(
            "Processing checkpoint: {}",
            checkpoint.checkpoint_summary.sequence_number
        );

        let mut iota_names_balance = false;
        let mut auction_house_balance = false;
        for object in checkpoint.latest_live_output_objects() {
            if object.id() == self.balance_object_id {
                let balance = get_iota_names_balance(object)?;
                self.metrics.iota_names_balance.set(balance.value() as _);
                iota_names_balance = true;
            } else if object.id() == self.extended_config.auction_house_id {
                let balance = get_auction_house_balance(object)?;
                self.metrics.auction_house_balance.set(balance.value() as _);
                auction_house_balance = true;
            } else {
                continue;
            }
            if iota_names_balance && auction_house_balance {
                break;
            }
        }

        for transaction in &checkpoint.transactions {
            let TransactionEffects::V1(effects) = &transaction.effects;

            if *effects.status() != ExecutionStatus::Success {
                continue;
            }

            if let Some(events) = &transaction.events {
                for event in events.data.iter() {
                    match IotaNamesEvent::try_from_event(event, &self.extended_config) {
                        Ok(Some(event)) => self.process_event(event)?,
                        Err(e) => warn!("parsing event failed: {e}"),
                        _ => {}
                    }
                }
            }

            let TransactionData::V1(data) = &transaction.transaction.intent_message().value;

            if let TransactionKind::ProgrammableTransaction(ptb) = &data.kind {
                self.process_ptb(ptb)?;
            }
        }

        Ok(())
    }
}

#[async_trait]
impl Worker for IotaNamesWorker {
    type Message = ();
    type Error = anyhow::Error;

    async fn process_checkpoint(
        &self,
        checkpoint: Arc<CheckpointData>,
    ) -> Result<Self::Message, Self::Error> {
        let res = AssertUnwindSafe(self.process_checkpoint(&checkpoint))
            .catch_unwind()
            .await
            .map_err(map_panic);
        if let Err(e) | Ok(Err(e)) = &res {
            tracing::error!("{e}");
            self.token.cancel();
        }
        res?
    }
}

/// Maps a panic payload to an error.
///
/// A invocation of the panic!() macro in Rust 2021 or later will always result
/// in a panic payload of type &'static str or String.
///
/// Only an invocation of panic_any (or, in Rust 2018 and earlier, panic!(x)
/// where x is something other than a string) can result in a panic payload
/// other than a &'static str or String.
/// See https://doc.rust-lang.org/stable/std/panic/struct.PanicHookInfo.html for more info
fn map_panic(payload: Box<dyn std::any::Any + Send + 'static>) -> anyhow::Error {
    if let Some(s) = payload.downcast_ref::<&str>() {
        anyhow!("{s}")
    } else if let Some(s) = payload.downcast_ref::<String>() {
        anyhow!("{s}")
    } else {
        anyhow!("unknown panic occurred")
    }
}

fn get_iota_names_balance(object: &Object) -> anyhow::Result<Balance> {
    Ok(bcs::from_bytes::<Field<MoveTypeLayout, Balance>>(
        object
            .as_inner()
            .data
            .try_as_move()
            .expect("invalid move object")
            .contents(),
    )?
    .value)
}

fn get_auction_house_balance(object: &Object) -> anyhow::Result<Balance> {
    #[expect(dead_code)]
    #[derive(serde::Deserialize)]
    struct AuctionHouse {
        pub id: ObjectID,
        pub balance: Balance,
        pub auctions: LinkedTable<Domain>,
    }

    Ok(bcs::from_bytes::<AuctionHouse>(
        object
            .as_inner()
            .data
            .try_as_move()
            .expect("invalid move object")
            .contents(),
    )?
    .balance)
}
