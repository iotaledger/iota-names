// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A module to support coupons for IOTA-Names.
/// This module allows secondary modules to add or remove coupons
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

use iota::table::Table;
use iota::clock::Clock;
use iota::dynamic_field as df;
use iota::hash::blake2b256;
use iota_names::iota_names::{Self, AdminCap, IotaNames};
use iota_names::payment::PaymentIntent;
use iota_names_coupons::coupon::{Self, Coupon};
use iota_names_coupons::coupons::{Self, Coupons};
use iota_names_coupons::rules::CouponRules;
use std::string::String;

/// An app that's not authorized tries to access private data.
#[error]
const EAppNotAuthorized: vector<u8> = b"App is not authorized.";
/// Tries to use app on an invalid version.
#[error]
const EInvalidVersion: vector<u8> = b"Invalid version.";
#[error]
const ECouponDoesNotExist: vector<u8> = b"Coupon does not exist.";

const USED_NON_STACKING_KEY: vector<u8> = b"used_not_stacking_coupon";
const TRUE_VAL: vector<u8> = b"true";
const FALSE_VAL: vector<u8> = b"false";

/// The coupons package versioning
public macro fun coupons_version(): u8 { 1 }

// Authorization for the Coupons on Iota-Names, to be able to register names on the
// app.
public struct CouponsAuth has drop {}

/// Authorization Key for secondary apps connected to this module.
public struct AuthKey<phantom A: drop> has copy, drop, store {}

/// The CouponHouse Shared Object which holds a table of coupon codes available
/// for claim.
public struct CouponHouse has store {
    coupons: Coupons,
    version: u8,
    id: UID,
}

/// Called once to setup the Coupon House on IOTA-Names.
public fun setup(iota_names: &mut IotaNames, cap: &AdminCap, ctx: &mut TxContext) {
    cap.add_registry(
        iota_names,
        CouponHouse {
            id: object::new(ctx),
            coupons: coupons::new(ctx),
            version: coupons_version!(),
        },
    );
}

#[allow(implicit_const_copy)]
public fun apply_coupon(
    intent: &mut PaymentIntent,
    iota_names: &mut IotaNames,
    coupon_code: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let coupon_house = coupon_house(iota_names);

    // Validate that specified coupon is valid.
    let hash = blake2b256(coupon_code.as_bytes());
    assert!(coupon_house.coupons_table().contains(hash), ECouponDoesNotExist);

    // Borrow coupon from the table.
    let coupon: &Coupon = &coupon_house.coupons_table()[hash];
    let metadata = intent.request_data_mut(iota_names, CouponsAuth {}).metadata_mut();

    let mut idx_opt = metadata.get_idx_opt(&USED_NON_STACKING_KEY.to_string());
    let used_non_stacking_val = if (coupon.rules().can_coupon_stack()) {
        FALSE_VAL
    } else {
        TRUE_VAL
    }.to_string();
    if (idx_opt.is_some()) {
        let (_, used_non_stacking_str) = metadata.get_entry_by_idx_mut(idx_opt.extract());
        let used_non_stacking = used_non_stacking_str.as_bytes() == TRUE_VAL;
        coupon.rules().assert_coupon_can_stack(used_non_stacking);
        *used_non_stacking_str = used_non_stacking_val;
    } else {
        metadata.insert(USED_NON_STACKING_KEY.to_string(), used_non_stacking_val);
    };

    let is_percentage = coupon.is_percentage();
    let discount = coupon.discount();

    // Verify coupon house is authorized to get the registry / register names.
    let coupon_house = coupon_house_mut(iota_names);
    // Mutably borrow coupon from the table.
    let coupon: &mut Coupon = &mut coupon_house.coupons_table_mut()[hash];

    // We need to do a total of 5 checks, based on `CouponRules`
    // Our checks work with `AND`, all of the conditions must pass for a coupon
    // to be used.
    // 1. Validate domain length.
    coupon
        .rules()
        .assert_coupon_valid_for_domain_length(
            intent.request_data().domain().sld().length() as u8,
        );
    // 2. Decrease available claims. Will ABORT if the coupon doesn't have
    // enough available claims.
    coupon.rules_mut().decrease_available_claims();
    // 3. Validate the coupon is valid for the specified user.
    coupon.rules().assert_coupon_valid_for_address(ctx.sender());
    // 4. Validate the coupon hasn't expired (Based on clock)
    coupon.rules().assert_coupon_is_not_expired(clock);
    // 5. Validate years are valid for the coupon.
    coupon.rules().assert_coupon_valid_for_domain_years(intent.request_data().years());

    // Clean up our registry by removing the coupon if no more available claims!
    if (!coupon.rules().has_available_claims()) {
        // remove the coupon, since it's no longer usable.
        let _: Coupon = coupon_house.coupons_table_mut().remove(hash);
    };

    if (is_percentage) {
        apply_percentage_discount(
            intent,
            iota_names,
            discount,
        );
    } else {
        apply_fixed_discount(
            intent,
            iota_names,
            discount,
        );
    };
}

/// Apply a fixed discount to the payment intent.
fun apply_fixed_discount(
    intent: &mut PaymentIntent,
    iota_names: &IotaNames,
    discount: u64,
) {
    let mut price = intent.request_data().base_amount();
    price = if (price >= discount) {
        price - discount
    } else {
        0
    };

    *intent.request_data_mut(iota_names, CouponsAuth {}).base_amount_mut() = price;
}

/// Apply a percentage discount to the payment intent.
fun apply_percentage_discount(
    intent: &mut PaymentIntent,
    iota_names: &IotaNames,
    percentage: u64,
) {
    let price = intent.request_data().base_amount();
    let discount_amount = (((price as u128) * (percentage as u128) / 100) as u64);

    *intent.request_data_mut(iota_names, CouponsAuth {}).base_amount_mut() = price - discount_amount;
}

// Get `Coupons` as an authorized app.
public fun auth_coupons_mut<A: drop>(iota_names: &mut IotaNames, _: A): &mut Coupons {
    let coupon_house_mut = coupon_house_mut(iota_names);
    // verify app is authorized to get a mutable reference.
    coupon_house_mut.assert_is_authorized<A>();
    &mut coupon_house_mut.coupons
}

/// Authorize an app on the coupon house. This allows to a secondary module to
/// add/remove coupons.
public fun authorize<A: drop>(_: &AdminCap, iota_names: &mut IotaNames) {
    df::add(&mut coupon_house_mut(iota_names).id, AuthKey<A> {}, true);
}

/// De-authorize an app. The app can no longer add or remove coupons.
public fun deauthorize<A: drop>(_: &AdminCap, iota_names: &mut IotaNames): bool {
    df::remove(&mut coupon_house_mut(iota_names).id, AuthKey<A> {})
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

/// Add a percentage based coupon as an admin.
/// First, call rules::new_coupon_rules to create the coupon's ruleset.
public fun admin_add_percentage_coupon(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    hash: String,
    amount: u64,
    rules: CouponRules,
) {
    let coupon_house = coupon_house_mut(iota_names);
    coupon_house.assert_version_is_valid();
    coupon_house.coupons.save_coupon(hash, coupon::new_percentage(amount, rules));
}

/// Add a fixed amount coupon as an admin.
/// 2. Call rules::new_coupon_rules to create the coupon's ruleset.
public fun admin_add_fixed_coupon(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    hash: String,
    amount: u64,
    rules: CouponRules,
) {
    let coupon_house = coupon_house_mut(iota_names);
    coupon_house.assert_version_is_valid();
    coupon_house.coupons.save_coupon(hash, coupon::new_fixed(amount, rules));
}

// Remove a coupon as a system's admin.
public fun admin_remove_coupon(_: &AdminCap, iota_names: &mut IotaNames, hash: String) {
    let coupon_house = coupon_house_mut(iota_names);
    coupon_house.assert_version_is_valid();
    coupon_house.coupons.remove_coupon(hash);
}

/// Check if an application is authorized to access protected features of the
/// Coupon House.
fun is_authorized<A: drop>(coupon_house: &CouponHouse): bool {
    df::exists_(&coupon_house.id, AuthKey<A> {})
}

/// Assert that an application is authorized to access protected features of
/// Coupon House.
/// Aborts with `EAppNotAuthorized` if not.
fun assert_is_authorized<A: drop>(coupon_house: &CouponHouse) {
    assert!(coupon_house.is_authorized<A>(), EAppNotAuthorized);
}

public(package) fun coupons(coupon_house: &CouponHouse): &Coupons {
    &coupon_house.coupons
}

public(package) fun coupons_mut(coupon_house: &mut CouponHouse): &mut Coupons {
    &mut coupon_house.coupons
}

public(package) fun coupons_table(coupon_house: &CouponHouse): &Table<vector<u8>, Coupon> {
    coupon_house.coupons.coupons()
}

public(package) fun coupons_table_mut(coupon_house: &mut CouponHouse): &mut Table<vector<u8>, Coupon> {
    coupon_house.coupons.coupons_mut()
}

/// Gets a reference to the coupon house
fun coupon_house(iota_names: &IotaNames): &CouponHouse {
    let coupons = iota_names.registry<CouponHouse>();
    coupons.assert_version_is_valid();
    coupons
}

/// Gets a mutable reference to the coupon house
public(package) fun coupon_house_mut(iota_names: &mut IotaNames): &mut CouponHouse {
    let coupons = iota_names::auth_registry_mut<CouponsAuth, CouponHouse>(
        CouponsAuth {},
        iota_names,
    );
    coupons.assert_version_is_valid();
    coupons
}
