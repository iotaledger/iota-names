// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// The main module of the IotaNames application, defines the `IotaNames` object and
/// the authorization mechanism for interacting with the main data storage.
///
/// Authorization mechanic:
/// The Admin can authorize applications to access protected features of the
/// IotaNames, they're named with a prefix `auth_*`. Once authorized, application can
/// get mutable access to the `Registry` and add to the application `Balance`.
///
/// At any moment any of the applications can be deauthorized by the Admin
/// making it impossible for the deauthorized module to access the registry.
/// ---
/// Package Upgrades in mind:
/// - None of the public functions of the IotaNames feature any specific types -
/// instead we use generics to define the actual types in arbitrary modules.
/// - The `Registry` itself (the main feature of the application) is stored as
/// a dynamic field so that we can change the type and the module that serves
/// the registry without breaking the IotaNames compatibility.
/// - Any of the old modules can be deauthorized hence disabling its access to
/// the registry and the balance.
module iota_names::iota_names;

use iota::balance::Balance;
use iota::coin::Coin;
use iota::dynamic_field as df;

use fun df::add as UID.add;
use fun df::borrow as UID.borrow;
use fun df::borrow_mut as UID.borrow_mut;
use fun df::exists_ as UID.exists_;
use fun df::remove as UID.remove;

#[error]
const EAppNotAuthorized: vector<u8> = b"The application is not authorized to access the feature.";
#[error]
const ENoProfitsInCoinType: vector<u8> = b"No profits in coin type.";

/// An admin capability. The admin has full control over the application.
/// This object must be issued only once during module initialization.
public struct AdminCap has key, store { id: UID }

/// The main application object. Stores the state of the application,
/// used for adding / removing and reading name records.
///
/// Dynamic fields:
/// - `registry: RegistryKey<R> -> R`
/// - `config: ConfigKey<C> -> C`
/// - `balance: BalanceKey<T> -> Balance<T>`
/// - `authorized_app: AuthKey<Auth> -> bool`
public struct IotaNames has key {
    id: UID,
}

/// The one-time-witness used to claim Publisher object.
public struct IOTA_NAMES has drop {}

// === Keys ===

/// Key under which a configuration is stored. It is type dependent, so
/// that different configurations can be stored at the same time. Eg
/// currently we store application `Config` (and `Promotion` configuration).
public struct ConfigKey<phantom Config> has copy, drop, store {}

/// Key under which the Registry object is stored.
///
/// In the V1, the object stored under this key is `Registry`, however, for
/// future migration purposes (if we ever need to change the Registry), we
/// keep the phantom parameter so two different Registries can co-exist.
public struct RegistryKey<phantom Config> has copy, drop, store {}
public struct BalanceKey<phantom T> has copy, drop, store {}

/// Module initializer:
/// - create IotaNames object
/// - create admin capability
/// - claim Publisher object (for Display and TransferPolicy)
fun init(otw: IOTA_NAMES, ctx: &mut TxContext) {
    iota::package::claim_and_keep(otw, ctx);

    // Create the admin capability; only performed once.
    transfer::transfer(
        AdminCap {
            id: object::new(ctx),
        },
        ctx.sender(),
    );

    let iota_names = IotaNames {
        id: object::new(ctx),
    };

    transfer::share_object(iota_names);
}

// === Admin actions ===

/// Withdraw from the IotaNames balance of a provided coin type.
public fun withdraw<T>(self: &mut IotaNames, _: &AdminCap, ctx: &mut TxContext): Coin<T> {
    let balance_key = BalanceKey<T> {};
    assert!(self.id.exists_(balance_key), ENoProfitsInCoinType);

    let balance = self.id.borrow_mut<_, Balance<T>>(balance_key);
    assert!(balance.value() > 0, ENoProfitsInCoinType);
    balance.withdraw_all().into_coin(ctx)
}

// === App Auth ===

/// An authorization Key kept in the IotaNames - allows applications access
/// protected features of the IotaNames (such as auth_add_balance, etc.)
/// The `App` type parameter is a witness which should be defined in the
/// original module (Controller, Registry, Registrar - whatever).
public struct AuthKey<phantom Auth: drop> has copy, drop, store {}

/// Authorize an application to access protected features of the iota_names.
public fun authorize<Auth: drop>(_: &AdminCap, self: &mut IotaNames) {
    self.id.add(AuthKey<Auth> {}, true);
}

/// Deauthorize an application by removing its authorization key.
public fun deauthorize<Auth: drop>(_: &AdminCap, self: &mut IotaNames): bool {
    self.id.remove(AuthKey<Auth> {})
}

/// Check if an application is authorized to access protected features of
/// the IotaNames.
public fun is_authorized<Auth: drop>(self: &IotaNames): bool {
    self.id.exists_(AuthKey<Auth> {})
}

/// Assert that an application is authorized to access protected features of
/// the IotaNames. Aborts with `EAppNotAuthorized` if not.
public fun assert_is_authorized<Auth: drop>(self: &IotaNames) {
    assert!(self.is_authorized<Auth>(), EAppNotAuthorized);
}

// === Protected features ===

/// Adds a balance of type `T` to the IotaNames protocol as an authorized app.
public fun auth_add_balance<Auth: drop, T>(self: &mut IotaNames, _: Auth, balance: Balance<T>) {
    self.assert_is_authorized<Auth>();
    let key = BalanceKey<T> {};
    if (self.id.exists_(key)) {
        let balances: &mut Balance<T> = self.id.borrow_mut(key);
        balances.join(balance);
    } else {
        self.id.add(key, balance);
    }
}

/// Get a mutable access to the `Registry` object. Can only be performed by
/// authorized applications.
public fun auth_registry_mut<Auth: drop, R: store>(_: Auth, self: &mut IotaNames): &mut R {
    self.assert_is_authorized<Auth>();
    self.pkg_registry_mut<R>()
}

// === Config management ===

/// Attach dynamic configuration object to the application.
public fun add_config<Config: store + drop>(_: &AdminCap, self: &mut IotaNames, config: Config) {
    self.id.add(ConfigKey<Config> {}, config);
}

/// Borrow configuration object. Read-only mode for applications.
public fun get_config<Config: store + drop>(self: &IotaNames): &Config {
    self.id.borrow(ConfigKey<Config> {})
}

/// Mutably borrow configuration object. Write mode for admin.
public fun get_config_mut<Config: store + drop>(_: &AdminCap, self: &mut IotaNames): &mut Config {
    self.id.borrow_mut(ConfigKey<Config> {})
}

/// Get the configuration object for editing. The admin should put it back
/// after editing (no extra check performed). Can be used to swap
/// configuration since the `T` has `drop`. Eg nothing is stopping the admin
/// from removing the configuration object and adding a new one.
///
/// Fully taking the config also allows for edits within a transaction.
public fun remove_config<Config: store + drop>(_: &AdminCap, self: &mut IotaNames): Config {
    self.id.remove(ConfigKey<Config> {})
}

// === Registry ===

/// Get a read-only access to the `Registry` object.
public fun registry<R: store>(self: &IotaNames): &R {
    self.id.borrow(RegistryKey<R> {})
}

/// Add a registry to the IotaNames. Can only be performed by the admin.
public fun add_registry<R: store>(_: &AdminCap, self: &mut IotaNames, registry: R) {
    self.id.add(RegistryKey<R> {}, registry);
}

/// Get a mutable access to the `Registry` object. Can only be called
/// internally by IotaNames.
public(package) fun pkg_registry_mut<R: store>(self: &mut IotaNames): &mut R {
    self.id.borrow_mut(RegistryKey<R> {})
}

// === Testing ===

#[test_only]
use iota_names::core_config;
#[test_only]
use iota_names::pricing_config::{Self, new_range, PricingConfig};
/// Authorization witness to call protected functions of `iota_names`.
#[test_only]
public struct TestAuth has drop {}

#[test_only]
const NANOS_PER_IOTA: u64 = 1_000_000_000;

#[test_only]
public fun new_for_testing(ctx: &mut TxContext): (IotaNames, AdminCap) {
    (IotaNames { id: object::new(ctx) }, AdminCap { id: object::new(ctx) })
}

#[test_only]
/// Wrapper of module initializer for testing
public fun init_for_testing(ctx: &mut TxContext): IotaNames {
    let admin_cap = AdminCap { id: object::new(ctx) };
    let mut iota_names = IotaNames {
        id: object::new(ctx),
    };

    admin_cap.add_config(&mut iota_names, core_config::default());

    admin_cap.authorize<TestAuth>(&mut iota_names);
    admin_cap.add_config(&mut iota_names, new_pricing_config());
    admin_cap.add_config(
        &mut iota_names,
        pricing_config::new_renewal_config(new_pricing_config()),
    );
    transfer::transfer(admin_cap, ctx.sender());

    iota_names
}

#[test_only]
public fun new_pricing_config(): PricingConfig {
    let range1 = new_range(vector[3, 3]);
    let range2 = new_range(vector[4, 4]);
    let range3 = new_range(vector[5, 63]);
    let prices = vector[1200 * NANOS_PER_IOTA, 200 * NANOS_PER_IOTA, 50 * NANOS_PER_IOTA];

    pricing_config::new(
        vector[range1, range2, range3],
        prices,
    )
}

#[test_only]
public fun share_for_testing(self: IotaNames) {
    transfer::share_object(self)
}

#[test_only]
/// Create an admin cap - only for testing.
public fun create_admin_cap_for_testing(ctx: &mut TxContext): AdminCap {
    AdminCap { id: object::new(ctx) }
}

#[test_only]
/// Burn the admin cap - only for testing.
public fun burn_admin_cap_for_testing(admin_cap: AdminCap) {
    let AdminCap { id } = admin_cap;
    id.delete();
}

#[test_only]
public fun authorize_for_testing<App: drop>(self: &mut IotaNames) {
    df::add(&mut self.id, AuthKey<App> {}, true)
}
