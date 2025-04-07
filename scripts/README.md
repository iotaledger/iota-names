# Scripts

This directory contains different scripts used to build transactions (for multi-sig operations).

## Setup IOTA-Names locally

To setup a local instance of IOTA-Names (or in any network of your choosing), all you need to do is call:

```
# network: choose from { mainnet, testnet, devnet, localnet }
# newOwner: provide an address to transfer ownership to (optional)
pnpm ts-node init/init.ts <network> [newOwner]
```

This will automatically publish all the packages in the correct order, collect all the variables in a `published.json`
file, as well as do a full on-chain setup (creation of the registry, addition of pricelist, authorization of all apps as well as
calling their respective setup functions).

Then, you can use these published variables to the SDK and call different actions (e.g. registering names, subnames etc)

> Do not check-in the `Move.lock` and `Move.toml` changes if you are submitting a PR.
