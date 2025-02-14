# How to test

To run e2e tests, you need to first run a local IOTA network with the simplest setup.
You'd need the `iota` repository installed, and you could run the following command on the `iota` root folder.

```sh
cargo build --bin iota --profile dev && cross-env RUST_LOG=info,iota=error,anemo_tower=warn,consensus=off cargo run --bin iota -- start --with-faucet --force-regenesis --epoch-duration-ms 300000
```

And then you can execute the tests (using a new terminal) by running:

```sh
pnpm test:e2e
```
