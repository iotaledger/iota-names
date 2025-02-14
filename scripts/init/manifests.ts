// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export const IOTANames = (rev: string) => (packageId?: string) => `[package]
name = "iota_names"
version = "0.0.1"
edition = "2024.beta"
${packageId ? `published-at = "${packageId}"` : ''}

[dependencies]
Iota = { git = "https://github.com/iotaledger/iota.git", subdir = "crates/iota-framework/packages/iota-framework", rev = "${rev}" }

[addresses]
iota_names = "${packageId || '0x0'}"`;

export const IOTANamesDependentPackages =
	(rev: string, name: string, extraDependencies?: string) => (packageId?: string) => `[package]
name = "${name}"
version = "0.0.1"
edition = "2024.beta"
${packageId ? `published-at = "${packageId}"` : ''}

[dependencies]
Iota = { git = "https://github.com/iotaledger/iota.git", subdir = "crates/iota-framework/packages/iota-framework", rev = "${rev}", override=true }
IotaNames = { local = "../iota-names" }
${extraDependencies || ''}

[addresses]
${name} = "${packageId || '0x0'}"`;

export const TempSubdomainProxy = (rev: string) => (packageId?: string) => `[package]
name = "temp_subdomain_proxy"
version = "0.0.1"
edition = "2024.beta"
${packageId ? `published-at = "${packageId}"` : ''}

[dependencies]
Iota = { git = "https://github.com/iotaledger/iota.git", subdir = "crates/iota-framework/packages/iota-framework", rev = "${rev}", override=true }
subdomains = { local = "../subdomains" }
utils = { local = "../utils" }

[addresses]
temp_subdomain_proxy = "${packageId || '0x0'}"
`;
