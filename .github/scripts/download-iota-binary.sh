#!/bin/bash
set -euo pipefail

# ============================================================================
# Downloads IOTA binaries from GitHub releases.
# Fetches the latest mainnet release by default, or uses IOTA_BINARY_VERSION.
# Adds binaries to PATH (and GITHUB_PATH if running in GitHub Actions).
# ============================================================================

fetch_latest_mainnet_version() {
    curl -s "https://api.github.com/repos/iotaledger/iota/releases" \
        | grep '"tag_name"' \
        | grep -oP '"tag_name":\s*"\Kv\d+\.\d+\.\d+(?=")' \
        | head -1
}

IOTA_BINARY_VERSION="${IOTA_BINARY_VERSION:-$(fetch_latest_mainnet_version)}"

echo "=== Downloading IOTA binaries (version: $IOTA_BINARY_VERSION) ==="

os_name=$(uname -s | tr '[:upper:]' '[:lower:]')
arch_name=$(uname -m)

[[ "$os_name" == "darwin" ]] && os_name="macos"
[[ "$arch_name" == "aarch64" ]] && arch_name="arm64"

asset_name="iota-$IOTA_BINARY_VERSION-${os_name}-${arch_name}.tgz"
download_url="https://github.com/iotaledger/iota/releases/download/$IOTA_BINARY_VERSION/$asset_name"

echo "Downloading from: $download_url"
curl -sL "$download_url" -o iota.tgz
tar -zxvf iota.tgz
chmod +x ./iota ./iota-indexer ./iota-graphql-rpc

export PATH="$(pwd):$PATH"
[[ -n "${GITHUB_PATH:-}" ]] && echo "$(pwd)" >> "$GITHUB_PATH"

echo "Binaries downloaded and added to PATH"
