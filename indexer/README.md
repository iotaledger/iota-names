# IOTA-Names indexer

Indexer to collect metrics about IOTA-Names.

## Testing

### Run a local network with IOTA-Names deployed

Follow the instructions from the [root README](../README.md#local-setup-for-testing)
Run the following commands also from the root directory.

### Set the environment variables

```bash
cd scripts && pnpm run envsForIndexer localnet file && cd ..
# testnet
cd scripts && pnpm run envsForIndexer testnet file && cd ..
```

### Build the indexer image

```bash
docker compose -f indexer/docker/docker-compose.yml build --build-arg CACHEBUST=$(date +%s)
```

Rust dependencies are cached by the Cargo.toml/Cargo.lock files, use `--no-cache` to force a full rebuild.

### Modify the docker-compose file

Update the `docker-compose.yml` file to use the commented `# Localnet values:`" instead of devnet for the start command of the iota-names-indexer.

To start collecting metrics from scratch in case restoring them from Prometheus fails, uncomment `--reset-metrics`.

### Start the indexer

```bash
docker compose -f indexer/docker/docker-compose.yml up
```

To reset all databases:

```bash
docker compose -f indexer/docker/docker-compose.yml down -v
```

The following endpoints will be available:

- **IOTA Names Indexer Metrics:** [http://localhost:9189/metrics](http://localhost:9189/metrics)
- **Auction REST API:** [http://localhost:3030](http://localhost:3030)
- **Prometheus:** [http://localhost:9090](http://localhost:9090)
- **Grafana:** [http://localhost:3000](http://localhost:3000)

## Auction REST API Endpoints

### Health Check

```
GET /health
```

Returns `OK` if the server is running.

### Get Names for an Address

```
GET /auctions/{address}
```

Returns all names that a specific address has bid on.

**Parameters:**

- `address`: IOTA address in hex format (e.g., `0x123...abc`)

**Response:**

```json
["auction.iota","one-more.iota"]
```

**Example:**

```bash
curl http://localhost:3030/auctions/0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215
```
