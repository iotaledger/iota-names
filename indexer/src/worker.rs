// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::{panic::AssertUnwindSafe, path::PathBuf, str::FromStr, sync::Arc};

use anyhow::{Result, anyhow, bail};
use async_trait::async_trait;
use diesel::Connection;
use futures::FutureExt;
use iota_data_ingestion_core::{
    DataIngestionMetrics, FileProgressStore, IndexerExecutor, ReaderOptions, Worker, WorkerPool,
    reader::v2::{CheckpointReaderConfig, RemoteUrl},
};
use iota_json::IotaJsonValue;
use iota_json_rpc_types::{IotaObjectDataOptions, IotaTransactionBlockResponseOptions};
use iota_names::name::Name;
use iota_sdk::IotaClientBuilder;
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
    db::{pool::DbConnectionPool, queries},
    events::{CouponKind, IotaNamesEvent},
};

pub(crate) async fn run_iota_names_reader(
    worker: IotaNamesWorker,
    node_url: &str,
    checkpoint_url: &str,
    registry: &Registry,
    concurrency: usize,
) -> anyhow::Result<()> {
    let progress_store_path = "./data/progress_store";
    initialize_progress_store(&worker, node_url, progress_store_path).await?;

    let progress_store = FileProgressStore::new(progress_store_path).await?;

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

    info!("Connecting to {checkpoint_url} to sync checkpoints");
    let reader_options = ReaderOptions {
        timeout_secs: 60,
        ..Default::default()
    };
    // Localnet does not support remote store, so we use the REST API
    if checkpoint_url.contains("localhost") || checkpoint_url.contains("host.docker.internal") {
        executor
            .run(
                // path to a local directory where checkpoints are stored.
                PathBuf::from("./data/chk"),
                Some(format!("{checkpoint_url}/api/v1")),
                // optional remote store access options.
                vec![],
                reader_options,
            )
            .await?;
    } else {
        let config = CheckpointReaderConfig {
            remote_store_url: Some(RemoteUrl::HybridHistoricalStore {
                historical_url: format!("{checkpoint_url}/ingestion/historical"),
                live_url: Some(format!("{checkpoint_url}/ingestion/live")),
            }),
            ingestion_path: Some(PathBuf::from("./data/chk")),
            reader_options,
        };
        executor.run_with_config(config).await?;
    }
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
                self.metrics.auctions_started.inc();
                let name_str = event.name.to_string();
                let mut conn = self.pool.get_connection()?;
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    let bidder = queries::get_or_create_bidder(conn, &event.bidder.to_string())?;
                    let name = queries::get_or_create_name(conn, &name_str)?;
                    queries::upsert_auctions_entry(conn, &name, event.end_timestamp_ms as _)?;
                    queries::add_bids_entry(conn, &bidder, &name, event.starting_bid)
                })?;
            }
            IotaNamesEvent::AuctionBid(event) => {
                let name_str = event.name.to_string();
                let mut conn = self.pool.get_connection()?;
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    let bidder = queries::get_or_create_bidder(conn, &event.bidder.to_string())?;
                    let name = queries::get_or_create_name(conn, &name_str)?;
                    queries::add_bids_entry(conn, &bidder, &name, event.bid)
                })?;
            }
            IotaNamesEvent::AuctionExtended(event) => {
                let name_str = event.name.to_string();
                let mut conn = self.pool.get_connection()?;
                conn.transaction::<_, anyhow::Error, _>(|conn| {
                    let name = queries::get_or_create_name(conn, &name_str)?;
                    queries::upsert_auctions_entry(conn, &name, event.end_timestamp_ms as _)
                })?;
            }
            IotaNamesEvent::AuctionFinalized(event) => {
                self.metrics.auctions_finalized.inc();
                self.metrics.auction_final_prices.observe(event.winning_bid);
                self.metrics
                    .auction_durations
                    .observe(event.end_timestamp_ms - event.start_timestamp_ms);
                let name_str = event.name.to_string();
                let mut conn = self.pool.get_connection()?;
                let bid_count = conn.transaction::<_, anyhow::Error, _>(|conn| {
                    let name = queries::get_or_create_name(conn, &name_str)?;
                    queries::claim_auctions_entry(conn, &name)?;
                    queries::get_bid_count(conn, &name_str)
                })?;
                self.metrics
                    .auction_bid_count_distribution
                    .with_label_values(&[&bid_count.to_string()])
                    .inc();
            }
            // `coupons`
            IotaNamesEvent::CouponApplied(event) => match event.kind {
                CouponKind::Percentage => {
                    self.metrics.percentage_discounts.add(event.discount as _)
                }
                CouponKind::Fixed => self.metrics.fixed_discounts.add(event.discount as _),
            },
            // `iota-names`
            IotaNamesEvent::NameRecordAdded(event) => {
                self.metrics.records_added.inc();

                let sln_length = event.name.label(1).expect("missing SLN").len();
                self.metrics
                    .length_distribution
                    .with_label_values(&[&sln_length.to_string()])
                    .inc();

                let depth = event.name.num_labels();
                self.metrics
                    .depth_distribution
                    .with_label_values(&[&depth.to_string()])
                    .inc();
            }
            IotaNamesEvent::NameRecordRemoved(event) => {
                self.metrics.records_removed.inc();

                let sln_length = event.name.label(1).expect("missing SLN").len();
                self.metrics
                    .length_distribution
                    .with_label_values(&[&sln_length.to_string()])
                    .dec();

                let depth = event.name.num_labels();
                self.metrics
                    .depth_distribution
                    .with_label_values(&[&depth.to_string()])
                    .dec();
            }
            IotaNamesEvent::TargetAddressSet(event) => {
                if event.target_address.is_some() {
                    self.metrics.target_addresses.inc()
                } else {
                    self.metrics.target_addresses.dec()
                }
            }
            IotaNamesEvent::ReverseLookupSet(_event) => self.metrics.default_names.inc(),
            IotaNamesEvent::ReverseLookupUnset(_event) => self.metrics.default_names.dec(),
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
            // `subnames`
            IotaNamesEvent::NodeSubnameCreated(_event) => {
                self.metrics.node_subnames.inc();
            }
            IotaNamesEvent::NodeSubnameBurned(_event) => {
                self.metrics.node_subnames.dec();
            }
            IotaNamesEvent::LeafSubnameCreated(_event) => {
                self.metrics.leaf_subnames.inc();
            }
            IotaNamesEvent::LeafSubnameRemoved(_event) => {
                self.metrics.leaf_subnames.dec();
            }
        }

        Ok(())
    }

    async fn process_checkpoint(&self, checkpoint: &CheckpointData) -> anyhow::Result<()> {
        // debug!(
        //     "Processing checkpoint: {}",
        //     checkpoint.checkpoint_summary.sequence_number
        // );

        // let mut iota_names_balance = false;
        // let mut auction_house_balance = false;
        // for object in checkpoint.latest_live_output_objects() {
        //     if object.id() == self.balance_object_id {
        //         let balance = get_iota_names_balance(object)?;
        //         self.metrics.balance.set(balance.value() as _);
        //         iota_names_balance = true;
        //     } else if object.id() == self.extended_config.auction_house_id {
        //         let balance = get_auction_house_balance(object)?;
        //         self.metrics.auction_house_balance.set(balance.value() as _);
        //         auction_house_balance = true;
        //     } else {
        //         continue;
        //     }
        //     if iota_names_balance && auction_house_balance {
        //         break;
        //     }
        // }

        // for transaction in &checkpoint.transactions {
        //     let TransactionEffects::V1(effects) = &transaction.effects;

        //     if *effects.status() != ExecutionStatus::Success {
        //         continue;
        //     }

        //     if let Some(events) = &transaction.events {
        //         for event in events.data.iter() {
        //             match IotaNamesEvent::try_from_event(event,
        // &self.extended_config) {                 Ok(Some(event)) =>
        // self.process_event(event)?,                 Err(e) => warn!("parsing
        // event failed: {e}"),                 _ => {}
        //             }
        //         }
        //     }
        // }

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
        pub auctions: LinkedTable<Name>,
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

async fn initialize_progress_store(
    worker: &IotaNamesWorker,
    node_url: &str,
    progress_store_path: &str,
) -> anyhow::Result<()> {
    if std::path::Path::new(progress_store_path).exists() {
        return Ok(());
    }

    info!("Progress store file not found, creating with initial checkpoint");
    let client = IotaClientBuilder::default().build(node_url).await?;

    let package_id = &worker.extended_config.iota_names_config.package_address;
    let checkpoint = get_package_deployment_checkpoint(&client, package_id).await?;

    // Create the data directory if it doesn't exist
    std::fs::create_dir_all("./data")?;

    let progress_content = serde_json::json!({
        "iota_names_reader": checkpoint
    });
    info!("Setting progress store checkpoint to: {checkpoint}");
    std::fs::write(
        progress_store_path,
        serde_json::to_string_pretty(&progress_content)?,
    )?;

    Ok(())
}

async fn get_package_deployment_checkpoint(
    client: &iota_sdk::IotaClient,
    package_address: &iota_types::base_types::IotaAddress,
) -> anyhow::Result<u64> {
    let object_response = client
        .read_api()
        .get_object_with_options(
            ObjectID::from(*package_address),
            IotaObjectDataOptions::default().with_previous_transaction(),
        )
        .await?;

    if let Some(error) = object_response.error {
        bail!("Failed to fetch package object: {error}");
    }

    let tx_response = client
        .read_api()
        .get_transaction_with_options(
            object_response.data.unwrap().previous_transaction.unwrap(),
            IotaTransactionBlockResponseOptions::default(),
        )
        .await?;
    if !tx_response.errors.is_empty() {
        bail!("Failed to fetch transaction: {:?}", tx_response.errors);
    }

    tx_response
        .checkpoint
        .ok_or_else(|| anyhow::anyhow!("Missing checkpoint"))
}
