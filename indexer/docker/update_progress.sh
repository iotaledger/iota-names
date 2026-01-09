#!/bin/bash

# This script updates the progress_store file for the iota-names-indexer.
# It can be used for testing by skipping syncing large parts of the history
# and testing only from specific checkpoints, allowing faster test runs.

# Testnet checkpoints for reference:
# Name bought with package id v2 161879819 https://explorer.iota.org/txblock/HkK2osCd8Wj8jh7dsTBB1xTVZmHJbFm7Y27XTuGncws8?network=testnet
# ./indexer/docker/update_progress.sh 161879819 

if [ $# -ne 1 ]; then
  echo "Usage: $0 <new_progress_value>"
  exit 1
fi

NEW_VALUE=$1

cd "$(dirname "$0")"

echo "Stopping the iota-names-indexer container..."
docker-compose down

echo "Updating progress_store to $NEW_VALUE..."
sudo rm -f /tmp/progress_store
sudo sh -c "echo '{\"iota_names_reader\": $NEW_VALUE}' > /tmp/progress_store"

echo "Copying updated file to volume..."
sudo cp /tmp/progress_store /var/lib/docker/volumes/docker_indexer_progress/_data/progress_store

echo "Restarting the container..."

docker-compose up

