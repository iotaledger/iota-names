// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::{
    net::{IpAddr, Ipv4Addr, SocketAddr},
    panic::AssertUnwindSafe,
};

use axum::{Extension, Router, routing::get};
use iota_metrics::{METRICS_ROUTE, RegistryService, histogram::Histogram};
use prometheus::{
    IntCounter, IntCounterVec, IntGauge, IntGaugeVec, Registry,
    register_int_counter_vec_with_registry, register_int_counter_with_registry,
    register_int_gauge_vec_with_registry, register_int_gauge_with_registry,
};
use tokio_util::sync::CancellationToken;
use tracing::info;

pub(crate) struct IotaNamesMetrics {
    pub total_name_records_added: IntCounter,
    pub total_name_records_removed: IntCounter,
    pub iota_names_balance: IntGauge,
    pub total_node_subdomains: IntGauge,
    pub total_leaf_subdomains: IntGauge,
    pub total_auction_started: IntGauge,
    pub total_auction_finalized: IntGauge,
    pub name_length_distribution: AssertUnwindSafe<IntGaugeVec>,
    pub renewal_years_distribution: AssertUnwindSafe<IntCounterVec>,
    pub name_depth_distribution: AssertUnwindSafe<IntGaugeVec>,
    pub user_data_distribution: AssertUnwindSafe<IntGaugeVec>,
    pub auction_final_prices: Histogram,
    pub total_bids_per_auction: AssertUnwindSafe<IntCounterVec>,
}

impl IotaNamesMetrics {
    pub fn new(registry: &Registry) -> Self {
        Self {
            total_name_records_added: register_int_counter_with_registry!(
                "total_name_records_added",
                "The total number of name records added to the registry",
                registry,
            )
            .unwrap(),
            total_name_records_removed: register_int_counter_with_registry!(
                "total_name_records_removed",
                "The total number of name records removed from the registry",
                registry,
            )
            .unwrap(),
            iota_names_balance: register_int_gauge_with_registry!(
                "iota_names_balance",
                "The balance held in IOTA-Names",
                registry,
            )
            .unwrap(),
            total_node_subdomains: register_int_gauge_with_registry!(
                "total_node_subdomains",
                "The total number of node subdomains in the registry",
                registry,
            )
            .unwrap(),
            total_leaf_subdomains: register_int_gauge_with_registry!(
                "total_leaf_subdomains",
                "The total number of leaf subdomains in the registry",
                registry,
            )
            .unwrap(),
            total_auction_started: register_int_gauge_with_registry!(
                "total_auction_started",
                "The total number of auction that were started",
                registry,
            )
            .unwrap(),
            total_auction_finalized: register_int_gauge_with_registry!(
                "total_auction_finalized",
                "The total number of auction that were finalized",
                registry,
            )
            .unwrap(),
            name_length_distribution: AssertUnwindSafe(
                register_int_gauge_vec_with_registry!(
                    "name_length_distribution",
                    "The length of second level names",
                    &["length"],
                    registry,
                )
                .unwrap(),
            ),
            renewal_years_distribution: AssertUnwindSafe(
                register_int_counter_vec_with_registry!(
                    "renewal_years_distribution",
                    "The number of years per renewal",
                    &["years"],
                    registry,
                )
                .unwrap(),
            ),
            name_depth_distribution: AssertUnwindSafe(
                register_int_gauge_vec_with_registry!(
                    "name_depth_distribution",
                    "Distribution of names depth",
                    &["depth"],
                    registry,
                )
                .unwrap(),
            ),
            user_data_distribution: AssertUnwindSafe(
                register_int_gauge_vec_with_registry!(
                    "user_data_distribution",
                    "Distribution of user data",
                    &["depth"],
                    registry,
                )
                .unwrap(),
            ),
            auction_final_prices: Histogram::new_in_registry(
                "auction_final_prices",
                "The final prices paid for domains in auctions",
                registry,
            ),
            total_bids_per_auction: AssertUnwindSafe(
                register_int_counter_vec_with_registry!(
                    "total_bids_per_auction",
                    "The total number of bids per auction",
                    &["auctions"],
                    registry,
                )
                .unwrap(),
            ),
        }
    }
}

pub(crate) struct PrometheusServer {
    registry_service: RegistryService,
}

impl PrometheusServer {
    pub(crate) fn new() -> Self {
        Self {
            registry_service: RegistryService::new(Registry::new()),
        }
    }

    pub(crate) async fn start(&self, token: CancellationToken) -> anyhow::Result<()> {
        let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)), 9189);
        info!("Starting prometheus metrics at {addr}");

        let app = Router::new()
            .route(METRICS_ROUTE, get(iota_metrics::metrics))
            .layer(Extension(self.registry_service.clone()));

        let listener = tokio::net::TcpListener::bind(&addr).await?;
        async fn shutdown_signal(token: CancellationToken) {
            token.cancelled().await;
        }
        axum::serve(listener, app.into_make_service())
            .with_graceful_shutdown(shutdown_signal(token))
            .await?;

        Ok(())
    }

    pub(crate) fn registry(&self) -> Registry {
        self.registry_service.default_registry()
    }
}
