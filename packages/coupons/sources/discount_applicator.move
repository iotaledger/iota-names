module iota_names_coupons::discount_applicator;

use iota::{clock::Clock, coin::Coin};
use iota_names::{iota_names::IotaNames, payment::{PaymentIntent, Receipt}};
use iota_names_coupons::{coupon::Coupon, coupon_house::{coupon_house_mut, request_data_mut}};
use std::string::String;

#[error]
const ECouponDoesNotExist: vector<u8> = b"Coupon does not exist.";
#[error]
const EInvalidDiscountPercentage: vector<u8> = b"Discount range is [0, 100].";

public struct DiscountApplicator {
    intent: PaymentIntent,
    used_non_stacking: bool,
}

public fun new(intent: PaymentIntent): DiscountApplicator {
    DiscountApplicator {
        intent,
        used_non_stacking: false,
    }
}

public fun apply_coupon(
    applicator: &mut DiscountApplicator,
    iota_names: &mut IotaNames,
    coupon_code: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Verify coupon house is authorized to get the registry / register names.
    let coupon_house = coupon_house_mut(iota_names);

    // Validate that specified coupon is valid.
    assert!(coupon_house.data().coupons().contains(coupon_code), ECouponDoesNotExist);

    // Borrow coupon from the table.
    let coupon: &mut Coupon = &mut coupon_house.data_mut().coupons_mut()[coupon_code];
    coupon.rules().assert_coupon_can_stack(applicator.used_non_stacking);
    applicator.used_non_stacking = applicator.used_non_stacking || !coupon.rules().can_coupon_stack();
    let percentage = coupon.discount_percentage();

    // We need to do a total of 5 checks, based on `CouponRules`
    // Our checks work with `AND`, all of the conditions must pass for a coupon
    // to be used.
    // 1. Validate domain size.
    coupon
        .rules()
        .assert_coupon_valid_for_domain_size(
            applicator.intent.request_data().domain().sld().length() as u8,
        );
    // 2. Decrease available claims. Will ABORT if the coupon doesn't have
    // enough available claims.
    coupon.rules_mut().decrease_available_claims();
    // 3. Validate the coupon is valid for the specified user.
    coupon.rules().assert_coupon_valid_for_address(ctx.sender());
    // 4. Validate the coupon hasn't expired (Based on clock)
    coupon.rules().assert_coupon_is_not_expired(clock);
    // 5. Validate years are valid for the coupon.
    coupon.rules().assert_coupon_valid_for_domain_years(applicator.intent.request_data().years());

    // Clean up our registry by removing the coupon if no more available claims!
    if (!coupon.rules().has_available_claims()) {
        // remove the coupon, since it's no longer usable.
        coupon_house.data_mut().remove_coupon(coupon_code);
    };

    applicator.apply_percentage_discount(
        iota_names,
        percentage as u8,
    );
}

/// Apply a percentage discount to the payment intent.
/// E.g. a payment can apply a 10% discount on top of a user's 20%
/// discount if the coupon allows it
fun apply_percentage_discount(
    applicator: &mut DiscountApplicator,
    iota_names: &IotaNames,
    // discount can be in range [1, 100]
    discount: u8,
) {
    assert!(discount <= 100, EInvalidDiscountPercentage);

    let price = applicator.intent.request_data().base_amount();
    let discount_amount = (((price as u128) * (discount as u128) / 100) as u64);

    *request_data_mut(&mut applicator.intent, iota_names).base_amount_mut() =
        price - discount_amount;
}

/// This has to be called with our base payment currency.
/// The payment has to be equal to the base price of the domain.
/// We do not need to check the price feed for the base currency.
public fun handle_base_payment<T>(
    iota_names: &mut IotaNames,
    applicator: DiscountApplicator,
    payment: Coin<T>,
): Receipt {
    payments::payments::handle_base_payment(
        iota_names,
        applicator.into_intent(),
        payment,
    )
}

/// Returns the inner intent reference
public fun intent(self: &DiscountApplicator): &PaymentIntent {
    &self.intent
}

fun into_intent(self: DiscountApplicator): PaymentIntent {
    let DiscountApplicator { intent, used_non_stacking: _ } = self;
    intent
}
