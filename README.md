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

- IOTA binary https://docs.iota.org/developer/getting-started/install-iota
- pnpm https://pnpm.io

1. Start a local IOTA network in one terminal:

```bash
iota start --force-regenesis --with-faucet
```

2. In another terminal, create a new environment for the local network and switch to it:

```bash
iota client new-env --alias localnet --rpc http://127.0.0.1:9000 --graphql http://127.0.0.1:8000
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

Done, IOTA-Names is now ready for use 🚀

TODO: show how to setup the ENV variables so it can be used in the IOTA CLI without recompiling it, dependent on https://github.com/iotaledger/iota/pull/6650.
