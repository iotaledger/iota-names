# Build image (the specific rust version can also be passed, e.g. "1.82-bookworm")
ARG RUST_IMAGE_VERSION=bookworm
FROM rust:${RUST_IMAGE_VERSION} AS builder

ARG PROFILE=release
ARG CARGO_BUILD_FEATURES
# The GIT_REVISION environment variable is used during build time inside the rust crates
ARG GIT_REVISION
ENV GIT_REVISION=$GIT_REVISION

WORKDIR "/iota-names"

# Install build dependencies, including clang and lld for faster linking
RUN apt update && apt install -y cmake clang lld

# Configure Rust to use clang and lld as the linker
RUN mkdir -p ~/.cargo && \
  echo -e "[target.x86_64-unknown-linux-gnu]\nlinker = \"clang\"\nrustflags = [\"-C\", \"link-arg=-fuse-ld=lld\"]" > ~/.cargo/config.toml

# Install additional dependencies
RUN apt install -y libpq5 libpq-dev ca-certificates

WORKDIR /iota-names/indexer

# 1. Copy only Cargo.toml and Cargo.lock first (for dependency caching)
COPY indexer/Cargo.toml indexer/Cargo.lock ./

# 2. Create a dummy src/main.rs so cargo build can resolve dependencies, the actual source code would create another cache
RUN mkdir -p src && echo "fn main() {}" > src/main.rs

# 3. Build dependencies (this will be cached unless Cargo.toml/Cargo.lock changes)
RUN cargo build --profile ${PROFILE} --features ${CARGO_BUILD_FEATURES:=default} || true

# 4. Remove the dummy main.rs
RUN rm -rf src

# 5. Copy the rest of the source code
COPY indexer/ .

# 6. Build the actual project
RUN cargo build --profile ${PROFILE} --features ${CARGO_BUILD_FEATURES:=default}

# Copy the built binary to the working directory depending on the output folder of the profile,
# so we can copy it to the runtime image
RUN if [ -d target/release ]; then \
  TARGET_DIR="target/release"; \
  elif [ -d target/debug ]; then \
  TARGET_DIR="target/debug"; \
  else \
  echo "Error: No build directory found"; \
  exit 1; \
  fi && \
  mv $TARGET_DIR/iota-names-indexer ./;

# Production image
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies and tools
RUN apt update && apt install -y libpq5 ca-certificates curl

COPY --from=builder /iota-names/indexer/iota-names-indexer /usr/local/bin

ARG BUILD_DATE
ARG GIT_REVISION
LABEL build-date=$BUILD_DATE
LABEL git-revision=$GIT_REVISION

EXPOSE 9189/tcp

ENTRYPOINT ["/usr/local/bin/iota-names-indexer"]
