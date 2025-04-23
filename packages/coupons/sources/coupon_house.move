// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A module to support coupons for IOTA-Names.
/// This module allows secondary modules (e.g. Discord) to add or remove coupons
/// too.
/// This allows for separation of logic & ease of de-authorization in case we
/// don't want some functionality anymore.
///
/// Coupons are unique string codes, that can be used (based on the business
/// rules) to claim discounts in the app.
/// Each coupon is validated towards a list of rules. View `rules` module for
/// explanation.
/// The app is authorized on `IotaNames` to be able to claim names and add earnings
/// to the registry.
module iota_names_coupons::coupon_house;

use iota::dynamic_field as df;
use iota_names::iota_names::{Self, AdminCap, IotaNames};
use iota_names_coupons::{coupon, coupons::{Self, Coupons}, rules::CouponRules};
use std::string::String;
use iota_names::payment::{PaymentIntent, RequestData};

/// An app that's not authorized tries to access private data.
#[error]
const EAppNotAuthorized: vector<u8> = b"App is not authorized.";
/// Tries to use app on an invalid version.
#[error]
const EInvalidVersion: vector<u8> = b"Invalid version.";

/// The coupons package versioning
public macro fun coupons_version(): u8 { 1 }  

// Authorization for the Coupons on Iota-Names, to be able to register names on the
// app.
public struct CouponsApp has drop {}

/// Authorization Key for secondary apps (e.g. Discord) connected to this
/// module.
public struct AppKey<phantom A: drop> has copy, drop, store {}

/// The CouponHouse Shared Object which holds a table of coupon codes available
/// for claim.
public struct CouponHouse has store {
    coupons: Coupons,
    version: u8,
    storage: UID,
}

/// Called once to setup the CouponHouse on Iota-Names.
public fun setup(iota_names: &mut IotaNames, cap: &AdminCap, ctx: &mut TxContext) {
    cap.add_registry(
        iota_names,
        CouponHouse {
            storage: object::new(ctx),
            coupons: coupons::new(ctx),
            version: coupons_version!(),
        },
    );
}

// Get `Coupons` as an authorized app.
public fun app_coupons_mut<A: drop>(iota_names: &mut IotaNames, _: A): &mut Coupons {
    let coupon_house_mut = coupon_house_mut(iota_names);
    // verify app is authorized to get a mutable reference.
    coupon_house_mut.assert_app_is_authorized<A>();
    &mut coupon_house_mut.coupons
}

/// Authorize an app on the coupon house. This allows to a secondary module to
/// add/remove coupons.
public fun authorize_app<A: drop>(_: &AdminCap, iota_names: &mut IotaNames) {
    df::add(&mut coupon_house_mut(iota_names).storage, AppKey<A> {}, true);
}

/// De-authorize an app. The app can no longer add or remove
public fun deauthorize_app<A: drop>(_: &AdminCap, iota_names: &mut IotaNames): bool {
    df::remove(&mut coupon_house_mut(iota_names).storage, AppKey<A> {})
}

/// An admin helper to set the version of the shared object.
/// Registrations are only possible if the latest version is being used.
public fun set_version(_: &AdminCap, iota_names: &mut IotaNames, version: u8) {
    coupon_house_mut(iota_names).version = version;
}

/// Validate that the version of the app is the latest.
public fun assert_version_is_valid(self: &CouponHouse) {
    assert!(self.version == coupons_version!(), EInvalidVersion);
}

// Add a coupon as an admin.
/// To create a coupon, you have to call the PTB in the specific order
/// 1. (Optional) Call rules::new_domain_length_rule(type, length) // generate a
/// length specific rule (e.g. only domains of size 5)
/// 2. Call rules::coupon_rules(...) to create the coupon's ruleset.
public fun admin_add_coupon(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    code: String,
    kind: u8,
    amount: u64,
    rules: CouponRules,
    ctx: &mut TxContext,
) {
    let coupon_house = coupon_house_mut(iota_names);
    coupon_house.assert_version_is_valid();
    coupon_house.coupons.save_coupon(code, coupon::new(kind, amount, rules, ctx));
}

// Remove a coupon as a system's admin.
public fun admin_remove_coupon(_: &AdminCap, iota_names: &mut IotaNames, code: String) {
    let coupon_house = coupon_house_mut(iota_names);
    coupon_house.assert_version_is_valid();
    coupon_house.coupons.remove_coupon(code);
}

// Add coupon as a registered app.
public fun app_add_coupon(
    data: &mut Coupons,
    code: String,
    kind: u8,
    amount: u64,
    rules: CouponRules,
    ctx: &mut TxContext,
) {
    data.save_coupon(code, coupon::new(kind, amount, rules, ctx));
}

// Remove a coupon as a registered app.
public fun app_remove_coupon(data: &mut Coupons, code: String) {
    data.remove_coupon(code);
}

/// Check if an application is authorized to access protected features of the
/// Coupon House.
fun is_app_authorized<A: drop>(coupon_house: &CouponHouse): bool {
    df::exists_(&coupon_house.storage, AppKey<A> {})
}

/// Assert that an application is authorized to access protected features of
/// Coupon House.
/// Aborts with `EAppNotAuthorized` if not.
fun assert_app_is_authorized<A: drop>(coupon_house: &CouponHouse) {
    assert!(coupon_house.is_app_authorized<A>(), EAppNotAuthorized);
}

public(package) fun coupons(coupon_house: &CouponHouse): &Coupons {
    &coupon_house.coupons
}

public(package) fun coupons_mut(coupon_house: &mut CouponHouse): &mut Coupons {
    &mut coupon_house.coupons
}

/// Gets a mutable reference to the coupon's house
public(package) fun coupon_house_mut(iota_names: &mut IotaNames): &mut CouponHouse {
    // Verify coupon house is authorized to get the registry / register names.
    iota_names.assert_app_is_authorized<CouponsApp>();
    let coupons = iota_names::app_registry_mut<CouponsApp, CouponHouse>(
        CouponsApp {},
        iota_names,
    );
    coupons.assert_version_is_valid();
    coupons
}

public(package) fun request_data_mut(intent: &mut PaymentIntent, iota_names: &IotaNames): &mut RequestData {
    intent.request_data_mut(iota_names, CouponsApp{})
}
