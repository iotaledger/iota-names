# IOTA-Names indexer

Indexer to collect metrics about IOTA-Names.

## Testing

### Run a local network with IOTA-Names deployed

Follow the instructions from the [root README](../README.md#local-setup-for-testing)
Run the following commands also from the root directory.

### Set the environment variables

```bash
cd scripts && pnpm ts-node utils/envs.ts localnet > ../indexer/docker/.env && cd ..
```

### Build the indexer image

```bash
docker compose -f indexer/docker/docker-compose.yml build --build-arg CACHEBUST=$(date +%s)
```

Rust dependencies are cached by the Cargo.toml/Cargo.lock files, use `--no-cache` to force a full rebuild.

### Modify the docker-compose file

Update the `docker-compose.yml` file to use the commented `# Localnet values:`" instead of devnet for the start command of the iota-names-indexer.

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

## Admin Endpoints for Blocked Strings

All admin endpoints require an `Authorization: Bearer <API_KEY>` header.

### Block a String

```
POST /admin/blocked-strings
```

**Request body:**

```json
{
  "string": "badword",
  "matchType": "full"
}
```

- `matchType`: `"full"` (exact match) or `"substring"` (contains match). Defaults to `"full"`.

**Examples:**

```bash
# Block exact name only (default)
curl -X POST http://localhost:3030/admin/blocked-strings \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"string":"bad.iota"}'

# Block any name containing the substring
curl -X POST http://localhost:3030/admin/blocked-strings \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"string":"badword","matchType":"substring"}'
```

### Unblock a String

```
DELETE /admin/blocked-strings
```

**Request body:**

```json
{
  "string": "badword"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3030/admin/blocked-strings \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"string":"badword"}'
```

### List All Blocked Strings

```
GET /admin/blocked-strings
```

**Example:**

```bash
curl -X GET http://localhost:3030/admin/blocked-strings \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

### List Blocked Strings (Detailed)

```
GET /admin/blocked-strings/detailed
```

Returns blocked strings with their match types and IDs.

**Example:**

```bash
curl -X GET http://localhost:3030/admin/blocked-strings/detailed \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```
