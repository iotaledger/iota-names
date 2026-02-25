// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

mod api;
mod config;
mod db;
mod events;
mod metrics;
mod worker;

use std::sync::Arc;

use anyhow::Result;
use clap::Parser;
use iota_protocol_config::Chain;
use iota_sdk::IotaClientBuilder;
use iota_types::digests::ChainIdentifier;
use tokio::task::JoinSet;
use tokio_util::sync::CancellationToken;
use tracing::{error, info, warn};
use tracing_subscriber::{
    EnvFilter, fmt::format::FmtSpan, layer::SubscriberExt, util::SubscriberInitExt,
};

use crate::{
    api::start_api_server,
    config::IotaNamesExtendedConfig,
    db::pool::{DbConnectionPool, DbConnectionPoolConfig},
    metrics::{IotaNamesMetrics, PrometheusServer},
    worker::{IotaNamesWorker, run_iota_names_reader},
};

// Define the `GIT_REVISION` and `VERSION` consts
bin_version::bin_version!();

#[derive(Parser)]
#[command(
    name = env!("CARGO_BIN_NAME"),
    about = env!("CARGO_PKG_DESCRIPTION"),
    author,
    version = VERSION,
    propagate_version = true,
)]
enum Command {
    Start {
        #[clap(flatten)]
        connection_pool_config: DbConnectionPoolConfig,
        /// The URL of an IOTA node with JSON API.
        #[arg(long, default_value = "http://localhost:9000")]
        node_url: String,
        /// The URL of an IOTA node with REST API enabled or a historical store.
        #[arg(long, default_value = "http://localhost:9000")]
        checkpoint_url: String,
        /// The number of workers to spawn in parallel.
        #[arg(long, default_value_t = 1)]
        num_workers: usize,
        /// The port to run the API server on.
        #[arg(long, default_value_t = 3030)]
        api_port: u16,
        /// The URL of Prometheus to restore metrics from on startup.
        #[arg(long, default_value = "http://localhost:9090")]
        prometheus_url: String,
        /// Resets metrics in case of a Prometheus error.
        #[arg(long, default_value_t = false)]
        reset_metrics: bool,
    },
}

impl Command {
    async fn execute(self) -> Result<()> {
        match self {
            Command::Start {
                connection_pool_config,
                node_url,
                checkpoint_url,
                num_workers,
                api_port,
                prometheus_url,
                reset_metrics,
            } => {
                info!("Starting IOTA Names Indexer");

                let prometheus = PrometheusServer::new();
                let registry = prometheus.registry();
                let metrics = Arc::new(IotaNamesMetrics::new(&registry));

                // Try to restore metrics from Prometheus
                if let Err(e) = metrics.restore_from_prometheus(&prometheus_url).await {
                    if reset_metrics {
                        warn!(
                            "Could not restore metrics from Prometheus ({e}); proceeding with new metrics due to --reset-metrics flag"
                        );
                    } else {
                        return Err(anyhow::anyhow!(
                            "Could not restore metrics from Prometheus ({e}); provide --reset-metrics flag to reset metrics"
                        ));
                    }
                } else {
                    info!("Successfully restored metrics from Prometheus");
                }

                let cancel_token = CancellationToken::new();

                let mut tasks: JoinSet<Result<()>> = JoinSet::new();

                // Spawn the prometheus API
                let handle = cancel_token.clone();
                tasks.spawn(async move { prometheus.start(handle).await });

                let connection_pool = DbConnectionPool::new(connection_pool_config)?;
                connection_pool.run_migrations()?;

                // Spawn the auction API server
                let handle = cancel_token.clone();
                let database_pool = connection_pool.clone();
                tasks.spawn(async move { start_api_server(database_pool, api_port, handle).await });

                // Spawn the metrics worker
                let handle = cancel_token.clone();
                let iota_names_config = match IotaNamesExtendedConfig::from_env() {
                    Ok(config) => config,
                    Err(_) => {
                        // If environment variables are not set, determine config from the connected
                        // network
                        let chain =
                            IotaClientBuilder::default()
                                .build(&node_url)
                                .await?
                                .read_api()
                                .get_chain_identifier()
                                .await
                                .ok()
                                .and_then(|chain_id| {
                                    ChainIdentifier::from_chain_short_id(&chain_id)
                                })
                                .map(|chain_id| chain_id.chain())
                        .unwrap_or_else(|| {
                            warn!(
                                "Failed to get chain identifier from node, defaulting to Unknown"
                            );
                            Chain::Unknown
                        });
                        IotaNamesExtendedConfig::from_chain(&chain)
                    }
                };
                if iota_names_config.event_package_ids.is_empty() {
                    panic!("No EVENT_PACKAGE_IDS provided in the environment variables");
                }
                info!("Starting with IOTA-Names config: {iota_names_config:#?}");
                tasks.spawn(async move {
                    let worker = IotaNamesWorker::new(
                        connection_pool,
                        iota_names_config,
                        metrics,
                        handle.clone(),
                    )?;

                    tokio::select! {
                        res = run_iota_names_reader(worker, &node_url, &checkpoint_url, &registry, num_workers) => res,
                        _ = handle.cancelled() => Ok(()),
                    }
                });

                let mut exit_code = Ok(());

                tokio::select! {
                    res = interrupt_or_terminate() => {
                        cancel_token.cancel();
                        if let Err(err) = res {
                            tracing::error!("subscribing to OS interrupt signals failed with error: {err}; shutting down");
                            exit_code = Err(err);
                        } else {
                            tracing::info!("received interrupt; shutting down");
                        }
                    },
                    res = tasks.join_next() => {
                        cancel_token.cancel();
                        tracing::debug!("tasks have begun shutting down");
                        if let Some(Ok(Err(err))) = res {
                            tracing::error!("a worker failed with error: {err}");
                            exit_code = Err(err);
                        }
                        while let Some(res) = tasks.join_next().await {
                            if let Ok(Err(err)) = res {
                                tracing::error!("a worker failed with error: {err}");
                            }
                        }
                    },
                }

                // Allow the user to abort if the tasks aren't shutting down quickly.
                tokio::select! {
                    res = interrupt_or_terminate() => {
                        if let Err(err) = res {
                            tracing::error!("subscribing to OS interrupt signals failed with error: {err}; aborting");
                            exit_code = Err(err);
                        } else {
                            tracing::info!("received second interrupt; aborting");
                        }
                        tasks.shutdown().await;
                        tracing::info!("runtime aborted");
                    },
                    _ = async {
                            while let Some(res) = tasks.join_next().await {
                                if let Ok(Err(err)) = res {
                                    tracing::error!("a worker failed with error: {err}");
                                }
                            }
                        } => {
                        tracing::info!("runtime stopped");
                    },
                }

                exit_code
            }
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    set_up_logging()?;

    Command::parse().execute().await?;
    Ok(())
}

fn set_up_logging() -> Result<()> {
    std::panic::set_hook(Box::new(|p| {
        error!("{p}");
    }));

    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer().with_span_events(FmtSpan::CLOSE))
        .init();
    Ok(())
}

pub async fn interrupt_or_terminate() -> Result<()> {
    #[cfg(unix)]
    {
        use anyhow::anyhow;
        use tokio::signal::unix::{SignalKind, signal};
        let mut terminate = signal(SignalKind::terminate())
            .map_err(|e| anyhow!("cannot listen to `SIGTERM`: {e}"))?;
        let mut interrupt = signal(SignalKind::interrupt())
            .map_err(|e| anyhow!("cannot listen to `SIGINT`: {e}"))?;
        tokio::select! {
            _ = terminate.recv() => {}
            _ = interrupt.recv() => {}
        }
    }
    #[cfg(not(unix))]
    tokio::signal::ctrl_c().await?;

    Ok(())
}
