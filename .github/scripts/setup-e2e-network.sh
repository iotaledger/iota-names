#!/bin/bash
set -euo pipefail

# ============================================================================
# E2E Test Network Setup Script
# Downloads IOTA binaries, starts network, publishes iota-names packages,
# then restarts services with injected configs.
# ============================================================================

EPOCH_DURATION_MS="${EPOCH_DURATION_MS:-10000}"
CONFIG_DIR="${CONFIG_DIR:-$(pwd)/persisted-localnet}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRAPHQL_CONFIG="${GRAPHQL_CONFIG:-$(pwd)/graphql-config.toml}"
DB_URL="${DB_URL:-postgres://postgres:postgrespw@localhost:5432/iota_indexer}"

ADMIN_MNEMONIC="${ADMIN_MNEMONIC:?ADMIN_MNEMONIC environment variable is required}"


declare -a PIDS=()
PID_IOTA=""
PID_INDEXER_WRITER=""
PID_INDEXER_READER=""
PID_GRAPHQL=""

wait_for_url() {
    local url=$1
    local name=$2
    local log_file=${3:-}
    local max_attempts=${4:-60}

    echo "Waiting for $name at $url..."
    for i in $(seq 1 "$max_attempts"); do
        if curl -s -o /dev/null --connect-timeout 2 "$url" 2>/dev/null; then
            echo "$name is ready"
            return 0
        fi
        sleep 1
    done
    echo "ERROR: $name failed to become ready at $url after $max_attempts attempts"
    if [[ -n "$log_file" && -f "$log_file" ]]; then
        echo "=== Last 50 lines of $log_file ==="
        tail -50 "$log_file"
        echo "=== End of log ==="
    fi
    return 1
}

download_binaries() {
    source "$SCRIPT_DIR/download-iota-binary.sh"
}

# ============================================================================
# Initial startup (without iota-names config)
# ============================================================================
start_initial_network() {
    echo "=== Phase 1: Starting initial network ==="

    # Start iota node with force-regenesis for fresh state
    ./iota-localnet start \
        --network.config "$CONFIG_DIR" \
        --with-faucet \
        --faucet-amount 100000000000000 > iota-node.log 2>&1 &
    PID_IOTA=$!
    PIDS+=("$PID_IOTA")

    wait_for_url "http://127.0.0.1:9000/health" "iota-node" "iota-node.log"
    wait_for_url "http://127.0.0.1:9123" "faucet" "iota-node.log"

    # Start indexer-writer
    ./iota-indexer \
        --db-url "$DB_URL" \
        indexer \
        --rpc-client-url "http://127.0.0.1:9000" \
        --remote-store-url "http://127.0.0.1:9000/api/v1" \
        --reset-db > indexer-writer.log 2>&1 &
    PID_INDEXER_WRITER=$!
    PIDS+=("$PID_INDEXER_WRITER")

    sleep 5

    # Start indexer-reader
    ./iota-indexer \
        --db-url "$DB_URL" \
        --metrics-address "0.0.0.0:9185" \
        json-rpc-service \
        --rpc-client-url "http://127.0.0.1:9000" \
        --rpc-address "0.0.0.0:9124" > indexer-reader.log 2>&1 &
    PID_INDEXER_READER=$!
    PIDS+=("$PID_INDEXER_READER")

    wait_for_url "http://127.0.0.1:9124" "indexer-reader" "indexer-reader.log"

    # Start graphql (no config yet)
    ./iota-graphql-rpc start-server \
        --node-rpc-url "http://127.0.0.1:9000" \
        --prom-port 9186 \
        --port 9125 > graphql.log 2>&1 &
    PID_GRAPHQL=$!
    PIDS+=("$PID_GRAPHQL")

    wait_for_url "http://127.0.0.1:9125" "graphql" "graphql.log"

    echo "=== Phase 1 complete ==="
}

# ============================================================================
# Publish iota-names
# ============================================================================
publish_iota_names() {
    echo "=== Phase 2: Publishing iota-names ==="
    ./iota keytool import "$ADMIN_MNEMONIC" ed25519

    ./iota client --yes new-env --alias localnet --rpc http://127.0.0.1:9000
    ./iota client switch --env localnet
    ./iota client faucet
    sleep 5

    # Update auction constants for e2e tests
    bash dapp/scripts/update_auctions_constants.sh

    pushd scripts > /dev/null
    export NETWORK=localnet
    pnpm ts-node init/init.ts localnet
    pnpm ts-node tests/register-name.ts
    sleep 5

    echo "Published package info:"
    cat ./package-info/localnet.json

    # Load env vars into current shell
    eval "$(pnpm ts-node utils/envs.ts localnet bash)"
    popd > /dev/null

    # Export for subsequent functions
    export IOTA_NAMES_PACKAGE_ADDRESS
    export IOTA_NAMES_OBJECT_ID
    export IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS
    export IOTA_NAMES_REGISTRY_ID
    export IOTA_NAMES_REVERSE_REGISTRY_ID

    echo "=== Phase 2 complete ==="
}

# ============================================================================
# Stop localnet and inject iota-names
# ============================================================================
stop_and_inject_configs() {
    echo "=== Phase 3: Stopping localnet processes and injecting iota-names configs ==="

    for pid in $PID_IOTA $PID_INDEXER_WRITER $PID_INDEXER_READER $PID_GRAPHQL; do
        echo "Stopping PID: $pid"
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
    done

    for log in iota-node.log indexer-writer.log indexer-reader.log graphql.log; do
        echo -e "\n\n========== RESTARTED HERE ==========\n\n" >> "$log"
    done

    # Inject config into fullnode.yaml
    echo "Injecting config into $CONFIG_DIR/fullnode.yaml"
    cat >> "$CONFIG_DIR/fullnode.yaml" <<EOF
iota-names-config:
  package-address: "$IOTA_NAMES_PACKAGE_ADDRESS"
  object-id: "$IOTA_NAMES_OBJECT_ID"
  payments-package-address: "$IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS"
  registry-id: "$IOTA_NAMES_REGISTRY_ID"
  reverse-registry-id: "$IOTA_NAMES_REVERSE_REGISTRY_ID"
EOF

    # Create graphql config TOML from template
    echo "Creating graphql config at $GRAPHQL_CONFIG"
    envsubst < "$SCRIPT_DIR/templates/graphql-config.toml.template" > "$GRAPHQL_CONFIG"

    echo "=== Phase 3 complete ==="
}

# ============================================================================
# Phase 4: Restart with configs
# ============================================================================
restart_with_configs() {
    echo "=== Phase 4: Restarting services with configs ==="

    # Restart iota
    ./iota-localnet start \
        --network.config "$CONFIG_DIR" \
        --with-faucet \
        --faucet-amount 100000000000000 >> iota-node.log 2>&1 &
    PID_IOTA=$!
    PIDS+=("$PID_IOTA")

    wait_for_url "http://127.0.0.1:9000/health" "iota-node" "iota-node.log"

    # restart indexer-writer
    ./iota-indexer \
        --db-url "$DB_URL" \
        indexer \
        --rpc-client-url "http://127.0.0.1:9000" \
        --remote-store-url "http://127.0.0.1:9000/api/v1" \
        --reset-db >> indexer-writer.log 2>&1 &
    PID_INDEXER_WRITER=$!
    PIDS+=("$PID_INDEXER_WRITER")

    sleep 5

    # Restart indexer-reader with iota-names params
    ./iota-indexer \
        --db-url "$DB_URL" \
        --metrics-address "0.0.0.0:9185" \
        json-rpc-service \
        --rpc-client-url "http://127.0.0.1:9000" \
        --rpc-address "0.0.0.0:9124" \
        --iota-names-package-address "$IOTA_NAMES_PACKAGE_ADDRESS" \
        --iota-names-object-id "$IOTA_NAMES_OBJECT_ID" \
        --iota-names-payments-package-address "$IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS" \
        --iota-names-registry-id "$IOTA_NAMES_REGISTRY_ID" \
        --iota-names-reverse-registry-id "$IOTA_NAMES_REVERSE_REGISTRY_ID" >> indexer-reader.log 2>&1 &
    PID_INDEXER_READER=$!
    PIDS+=("$PID_INDEXER_READER")

    wait_for_url "http://127.0.0.1:9124" "indexer-reader" "indexer-reader.log"

    # Restart graphql with config file
    ./iota-graphql-rpc start-server \
        --node-rpc-url "http://127.0.0.1:9000" \
        --port 9125 \
        --prom-port 9186 \
        --config "$GRAPHQL_CONFIG" >> graphql.log 2>&1 &
    PID_GRAPHQL=$!
    PIDS+=("$PID_GRAPHQL")

    wait_for_url "http://127.0.0.1:9125" "graphql" "graphql.log"

    echo "=== Phase 4 complete ==="
}

# ============================================================================
# Main
# ============================================================================
main() {
    echo "=============================================="
    echo "IOTA E2E Network Setup"
    echo "=============================================="

    download_binaries
    start_initial_network
    publish_iota_names
    stop_and_inject_configs
    restart_with_configs

    echo "=============================================="
    echo "Network ready with iota-names configuration"
    echo "=============================================="
}

main "$@"
