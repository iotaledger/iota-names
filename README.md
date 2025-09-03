> [!NOTE]\
> By using this service, you agree to the [Terms & Conditions](https://testnet.iotanames.com/?modal=terms_conditions).

# IOTA-Names

This repository holds the IOTA-Names contracts (both the core and all system packages).

## Packages

The [packages](./packages/) folder contains a list of all the packages that are being used
for IOTA-Names, as well as their tests.

## Scripts

The [scripts](./scripts/) folder is more like a "scratchpad" for different actions we want to build for various multi-sig operations.

### Multi-sig Operations (Admin operations)

For combining signatures in order to execute a multi-sig operation, [you can follow this link to have a pre-completed link in the multi-sig toolkit.](https://multisig-toolkit.mystenlabs.com/combine-signatures?pks=%5B%22AD%2B3mg5J5olToTEYrcxJ6DaVxUCWCBYOgI9dADaSlh%2FD%22%2C%22AOSeqn1vaDsfKyErF5Oe2z6X0yD25HytzYxIN0sM9cSX%22%2C%22AJdLYYKG%2FCTI9yFl68meoO8gHKUcTLpip6AYRXsS0H3g%22%2C%22ANSiX5Dt4GGMydZKGlUdhbvJbJq%2FA4G5CwotC3h3LImf%22%2C%22AKvhJE5Kuto6KRqWaD8vtPJ7u2glSdZTfK5AWnFQ5jhu%22%2C%22AIsWkAJaleXuv6gq9Vtyxfigpr%2F9RqzRYCyB0pz8AWYS%22%5D&weights=1%2C1%2C1%2C1%2C1%2C1&threshold=3)

### Local setup for testing

Prerequisites:

- IOTA binary with the "iota-names" feature: `cargo install --locked --bin iota --features=iota-names --path crates/iota` in https://github.com/iotaledger/iota
- pnpm https://pnpm.io

1. Start a local IOTA network in one terminal:

```bash
iota start --force-regenesis --with-faucet
```

2. In another terminal, create a new environment for the local network and switch to it:

```bash
iota client new-env --alias localnet --rpc http://127.0.0.1:9000 --graphql http://127.0.0.1:9125
iota client switch --env localnet
```

3. Request funds from the faucet:

```bash
iota client faucet
```

4. Install the dependencies:

```bash
pnpm i
```

5. Build and publish the packages:

```bash
cd scripts && pnpm ts-node init/init.ts localnet
```

6. Get environment variables for the IOTA CLI:

```bash
pnpm run envs localnet
```

Set the resulting environment variables in your terminal.

Done, IOTA-Names is now ready for use 🚀

Register your first name with:

```bash
iota name register first.iota
```

All in one:

```bash
docker start postgres || docker run -d --name postgres -e POSTGRES_PASSWORD=postgrespw -e POSTGRES_INITDB_ARGS="-U postgres" -p 5432:5432 postgres:15 -c max_connections=1000
# Run network in the background without logs
iota start --force-regenesis --with-faucet --faucet-amount 100000000000000 --with-indexer --with-graphql > /dev/null 2>&1 &
iota client new-env --alias localnet --rpc http://127.0.0.1:9000 --graphql http://127.0.0.1:9125
iota client switch --env localnet
# wait for the network to start
sleep 10
iota client faucet
# wait for the faucet tx
sleep 2
pnpm i
cd scripts && pnpm ts-node init/init.ts localnet
pnpm run envs localnet
cd ..
```

To stop the local network in the background, run: `kill %1` or `kill <job-number>` that was printed when it was started.
