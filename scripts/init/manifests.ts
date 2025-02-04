// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
export const IOTANS = (rev: string) => (packageId?: string) => `[package]
name = "iotans"
version = "0.0.1"
edition = "2024.beta"
${packageId ? `published-at = "${packageId}"` : ''}

[dependencies]
# IOTA = { git = "https://github.com/iotaledger/iota.git", subdir = "crates/iota-framework/packages/iota-framework", rev = "${rev}" }
Iota = { local = "../../../iota/crates/iota-framework/packages/iota-framework" }

[addresses]
iotans = "${packageId || '0x0'}"`;

export const IOTANSDependentPackages =
	(rev: string, name: string, extraDependencies?: string) => (packageId?: string) => `[package]
name = "${name}"
version = "0.0.1"
edition = "2024.beta"
${packageId ? `published-at = "${packageId}"` : ''}

[dependencies]
# IOTA = { git = "https://github.com/iotaledger/iota.git", subdir = "crates/iota-framework/packages/iota-framework", rev = "${rev}", override=true }
Iota = { local = "../../../iota/crates/iota-framework/packages/iota-framework" }
iotans = { local = "../iotans" }
${extraDependencies || ''}

[addresses]
${name} = "${packageId || '0x0'}"`;

export const TempSubdomainProxy = (rev: string) => (packageId?: string) => `[package]
name = "temp_subdomain_proxy"
version = "0.0.1"
edition = "2024.beta"
${packageId ? `published-at = "${packageId}"` : ''}

[dependencies]
# IOTA = { git = "https://github.com/iotaledger/iota.git", subdir = "crates/iota-framework/packages/iota-framework", rev = "${rev}", override=true }
Iota = { local = "../../../iota/crates/iota-framework/packages/iota-framework" }
subdomains = { local = "../subdomains" }
utils = { local = "../utils" }

[addresses]
temp_subdomain_proxy = "${packageId || '0x0'}"
`;
