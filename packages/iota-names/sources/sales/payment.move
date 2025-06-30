// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// This module is used to streamline our payment flows.
///
/// Whenever a registration or renewal request comes in, we issue a
/// `PaymentIntent` that holds the data required to complete the payment,
/// nominated in the base price units (will be USDC in our case).
///
/// Authorized apps are required to finalize any payment, so we can ensure that
/// we can keep our payment flows upgradeable, without the need to upgrade the
/// packages whenever the core protocol has a change, as well as gated
/// (so we can turn registrations/renewals off in case of an emergency).
///
/// Authorized apps can also apply discounts to the payment intent. This is
/// useful for system-level discounts, or user-specific discounts.
module iota_names::payment;

use iota::clock::Clock;
use iota::coin::Coin;
use iota::event;
use iota::vec_map::{Self, VecMap};
use iota_names::constants;
use iota_names::core_config::CoreConfig;
use iota_names::name::{Self, Name};
use iota_names::iota_names::IotaNames;
use iota_names::iota_names_registration::IotaNamesRegistration;
use iota_names::pricing_config::{PricingConfig, RenewalConfig};
use iota_names::registry::Registry;
use std::string::String;
use std::type_name::{Self, TypeName};

#[error]
const ENotSupportedType: vector<u8> =
    b"Renewal is not supported in this function call. Call `renew` instead.";
#[error]
const ERecordNotFound: vector<u8> =
    b"Tried to renew a name that does not exist in the registry (has expired + has been burned)";
#[error]
const ERecordExpired: vector<u8> = b"Tried to renew an expired name (post grace period).";
#[error]
const EReceiptNameMismatch: vector<u8> =
    b"The receipt name does not match the name of the NFT.";
#[error]
const EVersionMismatch: vector<u8> =
    b"Version mismatch. The payment intent is not of the correct version for this package.";
#[error]
const ECannotRenewSubname: vector<u8> = b"Cannot renew a subname using the payment system.";
#[error]
const ECannotExceedMaxYears: vector<u8> = b"Cannot exceed the maximum number of years.";

/// The data required to complete a payment request.
public struct RequestData has drop {
    /// The version of the payment module.
    version: u8,
    /// The name for which the payment is being made.
    name: Name,
    /// The years for which the payment is being made.
    /// Defaults to 1 for registration.
    years: u8,
    /// The amount the user has to pay in base units.
    base_amount: u64,
    /// A metadata field for future-proofness.
    metadata: VecMap<String, String>,
}

/// The payment intent for a given name
/// - Registration: The user is registering a new name.
/// - Renewal: The user is renewing an existing name.
public enum PaymentIntent {
    Registration(RequestData),
    Renewal(RequestData),
}

/// A receipt that is generated after a successful payment.
/// Can be used to:
/// - Prove that the payment was successful.
/// - Register a new name, or renew an existing one.
public enum Receipt {
    Registration { name: Name, years: u8, version: u8 },
    Renewal { name: Name, years: u8, version: u8 },
}

/// An event that is emitted after a successful payment for
/// a `PaymentIntent`
public struct TransactionEvent has copy, drop, store {
    app: TypeName,
    name: Name,
    years: u8,
    request_data_version: u8,
    base_amount: u64,
    metadata: VecMap<String, String>,
    is_renewal: bool,
    // info about the actual payment (currency and equivalent amount)
    currency: TypeName,
    currency_amount: u64,
}

/// Allow an authorized app to finalize a payment.
/// Returns a receipt that can be used to register or renew a name.
///
/// SAFETY: Only authorized packages can call this.
/// We do not check the amount of funds in this helper.
/// This is the responsibility of the `payments` app.
public fun finalize_payment<A: drop, T>(
    intent: PaymentIntent,
    iota_names: &mut IotaNames,
    app: A,
    coin: Coin<T>,
): Receipt {
    event::emit(intent.to_event<A, T>(coin.value()));
    iota_names.auth_add_balance(app, coin.into_balance());

    match (intent) {
        PaymentIntent::Registration(data) => {
            Receipt::Registration {
                name: data.name,
                years: data.years,
                version: data.version,
            }
        },
        PaymentIntent::Renewal(data) => {
            Receipt::Renewal {
                name: data.name,
                years: data.years,
                version: data.version,
            }
        },
    }
}

/// Creates a `PaymentIntent` for registering a new name.
/// This is a hot-potato and can only be consumed in a single transaction.
public fun init_registration(iota_names: &mut IotaNames, name: String): PaymentIntent {
    let name = name::new(name);
    iota_names.get_config<CoreConfig>().assert_is_valid_for_sale(&name);

    let price = iota_names.get_config<PricingConfig>().calculate_base_price_of_name(name);

    PaymentIntent::Registration(RequestData {
        name,
        years: 1,
        base_amount: price,
        metadata: vec_map::empty(),
        version: constants::payments_version!(),
    })
}

/// Creates a `PaymentIntent` for renewing an existing name.
/// This is a hot-potato and can only be consumed in a single transaction.
public fun init_renewal(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    years: u8,
): PaymentIntent {
    let name = nft.name();
    assert!(!name.is_subname(), ECannotRenewSubname);
    assert!(years <= iota_names.get_config<CoreConfig>().max_years(), ECannotExceedMaxYears);

    let price = iota_names
        .get_config<RenewalConfig>()
        .config()
        .calculate_base_price_of_name(name);

    PaymentIntent::Renewal(RequestData {
        name,
        years,
        base_amount: price * (years as u64),
        metadata: vec_map::empty(),
        version: constants::payments_version!(),
    })
}

/// Register a name with the given receipt.
/// This is a hot-potato and can only be consumed in a single transaction.
public fun register(
    receipt: Receipt,
    iota_names: &mut IotaNames,
    clock: &Clock,
    ctx: &mut TxContext,
): IotaNamesRegistration {
    let config = iota_names.get_config<CoreConfig>();

    match (receipt) {
        Receipt::Registration { name, years, version } => {
            assert!(version == config.payments_version(), EVersionMismatch);
            config.assert_is_valid_for_sale(&name); // sanity check. We also check on `init_registration`.
            iota_names.pkg_registry_mut<Registry>().add_record(name, years, clock, ctx)
        },
        Receipt::Renewal { name: _, years: _, version: _ } => {
            abort ENotSupportedType
        },
    }
}

/// Renew a name with the given receipt.
/// This is a hot-potato and can only be consumed in a single transaction.
public fun renew(
    receipt: Receipt,
    iota_names: &mut IotaNames,
    nft: &mut IotaNamesRegistration,
    clock: &Clock,
    _ctx: &mut TxContext,
) {
    match (receipt) {
        Receipt::Renewal { name, years, version } => {
            let config = iota_names.get_config<CoreConfig>();
            let max_years = config.max_years();

            assert!(version == config.payments_version(), EVersionMismatch);
            assert!(nft.name() == name, EReceiptNameMismatch);
            let registry = iota_names.pkg_registry_mut<Registry>();
            // Calculate target expiration. Aborts if expiration or selected
            // years are invalid.
            let target_expiration = target_expiration(
                registry,
                name,
                clock,
                years,
            );

            // Check target_expiration is within the max years.
            assert!(
                target_expiration <= (
                clock.timestamp_ms() + ((max_years + 1 as u64) * constants::year_ms())
            ),
                ECannotExceedMaxYears,
            );
            // set the expiration of the NFT + the registry's name record.
            registry.set_expiration_timestamp_ms(
                nft,
                name,
                target_expiration,
            );
        },
        Receipt::Registration { name: _, years: _, version: _ } => {
            abort ENotSupportedType
        },
    }
}

/// Getters
public fun request_data(intent: &PaymentIntent): &RequestData {
    match (intent) {
        PaymentIntent::Registration(data) => data,
        PaymentIntent::Renewal(data) => data,
    }
}

public fun request_data_mut<A: drop>(
    intent: &mut PaymentIntent,
    iota_names: &IotaNames,
    _: A,
): &mut RequestData {
    iota_names.assert_is_authorized<A>();
    match (intent) {
        PaymentIntent::Registration(data) => data,
        PaymentIntent::Renewal(data) => data,
    }
}

public fun metadata(data: &RequestData): &VecMap<String, String> {
    &data.metadata
}

public fun metadata_mut(data: &mut RequestData): &mut VecMap<String, String> {
    &mut data.metadata
}

public fun request_base_amount(self: &PaymentIntent): u64 { self.request_data().base_amount() }

public fun years(self: &RequestData): u8 { self.years }

public fun base_amount(self: &RequestData): u64 { self.base_amount }

public fun base_amount_mut(self: &mut RequestData): &mut u64 { &mut self.base_amount }

public fun name(self: &RequestData): &Name { &self.name }

/// Public helper to calculate price after a percentage discount has been
/// applied.
public fun calculate_total_after_discount(data: &RequestData, discount: u8): u64 {
    let price = data.base_amount;
    let discount_amount = (((price as u128) * (discount as u128) / 100) as u64);

    price - discount_amount
}

/// Construct an event from a payment intent.
fun to_event<A: drop, T>(intent: &PaymentIntent, currency_amount: u64): TransactionEvent {
    let data = intent.request_data();
    let is_renewal = match (intent) {
        PaymentIntent::Registration(_) => false,
        PaymentIntent::Renewal(_) => true,
    };

    TransactionEvent {
        app: type_name::get<A>(),
        name: data.name,
        years: data.years,
        request_data_version: data.version,
        base_amount: data.base_amount,
        metadata: data.metadata,
        is_renewal,
        currency: type_name::get<T>(),
        currency_amount,
    }
}

/// Calculate the target expiration for a name,
/// or abort if the name or the expiration setup is invalid.
fun target_expiration(registry: &Registry, name: Name, clock: &Clock, no_years: u8): u64 {
    let name_record_option = registry.lookup(name);
    // validate that the name_record still exists in the registry.
    assert!(name_record_option.is_some(), ERecordNotFound);

    let name_record = name_record_option.destroy_some();

    // Validate that the name has not expired. If it has, we can only
    // re-purchase (and that might involve different pricing).
    assert!(!name_record.has_expired_past_grace_period(clock), ERecordExpired);

    // Calculate the target expiration!
    let target = name_record.expiration_timestamp_ms() + (no_years as u64) * constants::year_ms();

    target
}

#[test_only]
public(package) fun test_registration_receipt(name: String, years: u8, version: u8): Receipt {
    Receipt::Registration {
        name: name::new(name),
        years,
        version,
    }
}

#[test_only]
public(package) fun test_renewal_receipt(name: String, years: u8, version: u8): Receipt {
    Receipt::Renewal {
        name: name::new(name),
        years,
        version,
    }
}
