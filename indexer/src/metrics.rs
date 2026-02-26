// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use std::net::{IpAddr, Ipv4Addr, SocketAddr};

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
    pub records_added: IntCounter,
    pub records_removed: IntCounter,
    pub balance: IntGauge,
    pub node_subnames: IntGauge,
    pub leaf_subnames: IntGauge,
    pub auctions_started: IntGauge,
    pub auctions_finalized: IntGauge,
    pub target_addresses: IntGauge,
    pub default_names: IntGauge,
    pub length_distribution: IntGaugeVec,
    pub renewal_years_distribution: IntCounterVec,
    pub depth_distribution: IntGaugeVec,
    pub user_data_distribution: IntGaugeVec,
    pub auction_final_prices: Histogram,
    pub auction_durations: Histogram,
    pub auction_house_balance: IntGauge,
    pub auction_bid_count_distribution: IntGaugeVec,
    pub percentage_discounts: IntGauge,
    pub fixed_discounts: IntGauge,
    pub purchases: IntCounter,
}

impl IotaNamesMetrics {
    pub fn new(registry: &Registry) -> Self {
        Self {
            records_added: register_int_counter_with_registry!(
                "iota_names_records_added",
                "The total number of name records added to the registry",
                registry,
            )
            .unwrap(),
            records_removed: register_int_counter_with_registry!(
                "iota_names_records_removed",
                "The total number of name records removed from the registry",
                registry,
            )
            .unwrap(),
            balance: register_int_gauge_with_registry!(
                "iota_names_balance",
                "The balance held in IOTA-Names",
                registry,
            )
            .unwrap(),
            node_subnames: register_int_gauge_with_registry!(
                "iota_names_node_subnames",
                "The total number of node subnames in the registry",
                registry,
            )
            .unwrap(),
            leaf_subnames: register_int_gauge_with_registry!(
                "iota_names_leaf_subnames",
                "The total number of leaf subnames in the registry",
                registry,
            )
            .unwrap(),
            auctions_started: register_int_gauge_with_registry!(
                "iota_names_auctions_started",
                "The total number of auction that were started",
                registry,
            )
            .unwrap(),
            auctions_finalized: register_int_gauge_with_registry!(
                "iota_names_auctions_finalized",
                "The total number of auction that were finalized",
                registry,
            )
            .unwrap(),
            target_addresses: register_int_gauge_with_registry!(
                "iota_names_target_addresses",
                "The total number of target addresses set",
                registry,
            )
            .unwrap(),
            default_names: register_int_gauge_with_registry!(
                "iota_names_default_names",
                "The total number of default names set",
                registry,
            )
            .unwrap(),
            length_distribution: register_int_gauge_vec_with_registry!(
                "iota_names_length_distribution",
                "The length of second level names",
                &["length"],
                registry,
            )
            .unwrap(),
            renewal_years_distribution: register_int_counter_vec_with_registry!(
                "iota_names_renewal_years_distribution",
                "The number of years per renewal",
                &["years"],
                registry,
            )
            .unwrap(),
            depth_distribution: register_int_gauge_vec_with_registry!(
                "iota_names_depth_distribution",
                "Distribution of names depth",
                &["depth"],
                registry,
            )
            .unwrap(),
            user_data_distribution: register_int_gauge_vec_with_registry!(
                "iota_names_user_data_distribution",
                "Distribution of user data",
                &["key"],
                registry,
            )
            .unwrap(),
            auction_final_prices: Histogram::new_in_registry(
                "iota_names_auction_final_prices",
                "The final prices paid for names in auctions",
                registry,
            ),
            auction_durations: Histogram::new_in_registry(
                "iota_names_auction_durations",
                "The durations of auctions",
                registry,
            ),
            auction_bid_count_distribution: register_int_gauge_vec_with_registry!(
                "iota_names_auction_bid_count_distribution",
                "Distribution of total bid count per auction",
                &["bid_count"],
                registry,
            )
            .unwrap(),
            auction_house_balance: register_int_gauge_with_registry!(
                "iota_names_auction_house_balance",
                "The balance held in the auction house",
                registry,
            )
            .unwrap(),
            percentage_discounts: register_int_gauge_with_registry!(
                "iota_names_percentage_discounts",
                "The total amount of percentage discount applied",
                registry,
            )
            .unwrap(),
            fixed_discounts: register_int_gauge_with_registry!(
                "iota_names_fixed_discounts",
                "The total amount of fixed discount applied",
                registry,
            )
            .unwrap(),
            purchases: register_int_counter_with_registry!(
                "iota_names_purchases",
                "The total number of direct purchases",
                registry,
            )
            .unwrap(),
        }
    }

    /// Restore metrics from Prometheus by querying the latest values
    pub async fn restore_from_prometheus(&self, prometheus_url: &str) -> anyhow::Result<()> {
        let client = reqwest::Client::new();

        // Macro to restore simple metrics
        macro_rules! restore_metric {
            ($metric_name:literal, $field:ident, counter) => {
                let value = self
                    .query_metric_value(&client, prometheus_url, $metric_name)
                    .await?;
                self.$field.inc_by(value as u64);
            };
            ($metric_name:literal, $field:ident, gauge) => {
                let value = self
                    .query_metric_value(&client, prometheus_url, $metric_name)
                    .await?;
                self.$field.set(value);
            };
        }

        // Restore simple counters and gauges
        restore_metric!("iota_names_records_added", records_added, counter);
        restore_metric!("iota_names_records_removed", records_removed, counter);
        restore_metric!("iota_names_balance", balance, gauge);
        restore_metric!("iota_names_node_subnames", node_subnames, gauge);
        restore_metric!("iota_names_leaf_subnames", leaf_subnames, gauge);
        restore_metric!("iota_names_auctions_started", auctions_started, gauge);
        restore_metric!("iota_names_auctions_finalized", auctions_finalized, gauge);
        restore_metric!("iota_names_target_addresses", target_addresses, gauge);
        restore_metric!("iota_names_default_names", default_names, gauge);
        restore_metric!(
            "iota_names_auction_house_balance",
            auction_house_balance,
            gauge
        );
        restore_metric!(
            "iota_names_percentage_discounts",
            percentage_discounts,
            gauge
        );
        restore_metric!("iota_names_fixed_discounts", fixed_discounts, gauge);
        restore_metric!("iota_names_purchases", purchases, counter);

        // Restore vector metrics
        self.restore_labeled_metrics(&client, prometheus_url)
            .await?;

        info!("Successfully restored metrics from Prometheus");
        Ok(())
    }

    async fn query_metric_value(
        &self,
        client: &reqwest::Client,
        prometheus_url: &str,
        metric_name: &str,
    ) -> anyhow::Result<i64> {
        let query = format!("{prometheus_url}/api/v1/query?query={metric_name}");
        let response: serde_json::Value = client.get(&query).send().await?.json().await?;

        if let Some(result) = response["data"]["result"].as_array() {
            if let Some(first_result) = result.first() {
                if let Some(value_str) = first_result["value"][1].as_str() {
                    return Ok(value_str.parse::<f64>()? as i64);
                }
            }
        }
        Ok(0)
    }

    async fn restore_labeled_metrics(
        &self,
        client: &reqwest::Client,
        prometheus_url: &str,
    ) -> anyhow::Result<()> {
        // Macro to restore vector metrics
        macro_rules! restore_vector_metric {
            ($metric_name:literal, $label_key:literal, $field:ident, gauge) => {
                self.restore_and_set_gauge_vector(
                    client,
                    prometheus_url,
                    $metric_name,
                    $label_key,
                    &self.$field,
                )
                .await?;
            };
            ($metric_name:literal, $label_key:literal, $field:ident, counter) => {
                self.restore_and_set_counter_vector(
                    client,
                    prometheus_url,
                    $metric_name,
                    $label_key,
                    &self.$field,
                )
                .await?;
            };
        }

        // Restore vector metrics
        restore_vector_metric!(
            "iota_names_length_distribution",
            "length",
            length_distribution,
            gauge
        );
        restore_vector_metric!(
            "iota_names_depth_distribution",
            "depth",
            depth_distribution,
            gauge
        );
        restore_vector_metric!(
            "iota_names_user_data_distribution",
            "depth",
            user_data_distribution,
            gauge
        );
        restore_vector_metric!(
            "iota_names_renewal_years_distribution",
            "years",
            renewal_years_distribution,
            counter
        );
        restore_vector_metric!(
            "iota_names_auction_bid_count_distribution",
            "bid_count",
            auction_bid_count_distribution,
            gauge
        );

        Ok(())
    }

    async fn restore_and_set_gauge_vector(
        &self,
        client: &reqwest::Client,
        prometheus_url: &str,
        metric_name: &str,
        label_key: &str,
        gauge_vec: &IntGaugeVec,
    ) -> anyhow::Result<()> {
        let values = self
            .query_vector_metric_values(client, prometheus_url, metric_name, label_key)
            .await?;

        for (label_value, value) in values {
            gauge_vec.with_label_values(&[&label_value]).set(value);
        }

        Ok(())
    }

    async fn restore_and_set_counter_vector(
        &self,
        client: &reqwest::Client,
        prometheus_url: &str,
        metric_name: &str,
        label_key: &str,
        counter_vec: &IntCounterVec,
    ) -> anyhow::Result<()> {
        let values = self
            .query_vector_metric_values(client, prometheus_url, metric_name, label_key)
            .await?;

        for (label_value, value) in values {
            counter_vec
                .with_label_values(&[&label_value])
                .inc_by(value as u64);
        }

        Ok(())
    }

    async fn query_vector_metric_values(
        &self,
        client: &reqwest::Client,
        prometheus_url: &str,
        metric_name: &str,
        label_key: &str,
    ) -> anyhow::Result<Vec<(String, i64)>> {
        let query = format!("{prometheus_url}/api/v1/query?query={metric_name}");
        let response: serde_json::Value = client.get(&query).send().await?.json().await?;

        let mut results = Vec::new();

        if let Some(data) = response["data"]["result"].as_array() {
            for result in data {
                if let (Some(labels), Some(value_str)) =
                    (result["metric"].as_object(), result["value"][1].as_str())
                {
                    let value = value_str.parse::<f64>()? as i64;

                    if let Some(label_value) = labels.get(label_key).and_then(|v| v.as_str()) {
                        results.push((label_value.to_string(), value));
                    }
                }
            }
        }

        Ok(results)
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
