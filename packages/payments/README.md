# Payments

This package provides utilities for making payments for IOTA Names. It is extensible so that additional coin configurations can be added to allow paying with non-IOTA coins.

## Usage

At its core, this package is used to take a payment intent created by IOTA-Names and fulfill the promised payment, thus receiving a receipt which can be used to claim the purchased NFT. This is guaranteed by the usage of hot-potatoes which prohibit invalid usage.
