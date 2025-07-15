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
    pub total_name_records_added: IntCounter,
    pub total_name_records_removed: IntCounter,
    pub iota_names_balance: IntGauge,
    pub total_node_subnames: IntGauge,
    pub total_leaf_subnames: IntGauge,
    pub total_auction_started: IntGauge,
    pub total_auction_finalized: IntGauge,
    pub total_target_address: IntGauge,
    pub total_default_name: IntGauge,
    pub name_length_distribution: IntGaugeVec,
    pub renewal_years_distribution: IntCounterVec,
    pub name_depth_distribution: IntGaugeVec,
    pub user_data_distribution: IntGaugeVec,
    pub auction_final_prices: Histogram,
    pub auction_durations: Histogram,
    pub auction_house_balance: IntGauge,
    pub auction_bid_count_distribution: IntGaugeVec,
    pub total_percentage_discount: IntGauge,
    pub total_fixed_discount: IntGauge,
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
            total_node_subnames: register_int_gauge_with_registry!(
                "total_node_subnames",
                "The total number of node subnames in the registry",
                registry,
            )
            .unwrap(),
            total_leaf_subnames: register_int_gauge_with_registry!(
                "total_leaf_subnames",
                "The total number of leaf subnames in the registry",
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
            total_target_address: register_int_gauge_with_registry!(
                "total_target_address",
                "The total number of target addresses set",
                registry,
            )
            .unwrap(),
            total_default_name: register_int_gauge_with_registry!(
                "total_default_name",
                "The total number of default names set",
                registry,
            )
            .unwrap(),
            name_length_distribution: register_int_gauge_vec_with_registry!(
                "name_length_distribution",
                "The length of second level names",
                &["length"],
                registry,
            )
            .unwrap(),
            renewal_years_distribution: register_int_counter_vec_with_registry!(
                "renewal_years_distribution",
                "The number of years per renewal",
                &["years"],
                registry,
            )
            .unwrap(),
            name_depth_distribution: register_int_gauge_vec_with_registry!(
                "name_depth_distribution",
                "Distribution of names depth",
                &["depth"],
                registry,
            )
            .unwrap(),
            user_data_distribution: register_int_gauge_vec_with_registry!(
                "user_data_distribution",
                "Distribution of user data",
                &["key"],
                registry,
            )
            .unwrap(),
            auction_final_prices: Histogram::new_in_registry(
                "auction_final_prices",
                "The final prices paid for names in auctions",
                registry,
            ),
            auction_durations: Histogram::new_in_registry(
                "auction_durations",
                "The durations of auctions",
                registry,
            ),
            auction_bid_count_distribution: register_int_gauge_vec_with_registry!(
                "auction_bid_count_distribution",
                "Distribution of total bid count per auction",
                &["bid_count"],
                registry,
            )
            .unwrap(),
            auction_house_balance: register_int_gauge_with_registry!(
                "auction_house_balance",
                "The balance held in the auction house",
                registry,
            )
            .unwrap(),
            total_percentage_discount: register_int_gauge_with_registry!(
                "total_percentage_discount",
                "The total amount of percentage discount applied",
                registry,
            )
            .unwrap(),
            total_fixed_discount: register_int_gauge_with_registry!(
                "total_fixed_discount",
                "The total amount of fixed discount applied",
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
                if let Ok(value) = self
                    .query_metric_value(&client, prometheus_url, $metric_name)
                    .await
                {
                    self.$field.inc_by(value as u64);
                }
            };
            ($metric_name:literal, $field:ident, gauge) => {
                if let Ok(value) = self
                    .query_metric_value(&client, prometheus_url, $metric_name)
                    .await
                {
                    self.$field.set(value);
                }
            };
        }

        // Restore simple counters and gauges
        restore_metric!(
            "total_name_records_added",
            total_name_records_added,
            counter
        );
        restore_metric!(
            "total_name_records_removed",
            total_name_records_removed,
            counter
        );
        restore_metric!("iota_names_balance", iota_names_balance, gauge);
        restore_metric!("total_node_subnames", total_node_subnames, gauge);
        restore_metric!("total_leaf_subnames", total_leaf_subnames, gauge);
        restore_metric!("total_auction_started", total_auction_started, gauge);
        restore_metric!("total_auction_finalized", total_auction_finalized, gauge);
        restore_metric!("total_target_address", total_target_address, gauge);
        restore_metric!("total_default_name", total_default_name, gauge);
        restore_metric!("auction_house_balance", auction_house_balance, gauge);
        restore_metric!(
            "total_percentage_discount",
            total_percentage_discount,
            gauge
        );
        restore_metric!("total_fixed_discount", total_fixed_discount, gauge);

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
            "name_length_distribution",
            "length",
            name_length_distribution,
            gauge
        );
        restore_vector_metric!(
            "name_depth_distribution",
            "depth",
            name_depth_distribution,
            gauge
        );
        restore_vector_metric!(
            "user_data_distribution",
            "depth",
            user_data_distribution,
            gauge
        );
        restore_vector_metric!(
            "renewal_years_distribution",
            "years",
            renewal_years_distribution,
            counter
        );
        restore_vector_metric!(
            "auction_bid_count_distribution",
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
