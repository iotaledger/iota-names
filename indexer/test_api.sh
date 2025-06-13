#!/bin/bash

# Test script for the auction bids API

echo "Testing the auction bids API..."

# Test the health endpoint
echo "Testing health endpoint:"
curl -s http://localhost:3030/health
echo -e "\n"

# Test the bids endpoint with a sample address
echo "Testing bids endpoint with sample address:"
SAMPLE_ADDRESS="0x0000000000000000000000000000000000000000000000000000000000000000"
curl -s "http://localhost:3030/bids/$SAMPLE_ADDRESS" | jq '.' || echo "No JSON data or jq not available"
echo -e "\n"

echo "API test completed."
