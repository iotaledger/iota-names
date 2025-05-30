# IOTA-Names indexer

Indexer to collect metrics about IOTA-Names.

## Testing

### Run a local network with IOTA-Names deployed

../README.md#local-setup-for-testing

### Start the indexer

From the root of the repository, run:

```bash
docker compose -f indexer/docker/docker-compose.yml up
```

Add `--build` to rebuild the indexer image.

The following endpoints will be available:

- **IOTA Names Indexer Metrics:** [http://localhost:9184/metrics](http://localhost:9184/metrics)
- **Prometheus:** [http://localhost:9090](http://localhost:9090)
- **Grafana:** [http://localhost:3000](http://localhost:3000)

Reset the prometheus database if you want to start fresh:

```bash
docker compose -f indexer/docker/docker-compose.yml down
docker volume rm iota-names-indexer_prometheus_data
```