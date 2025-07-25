# Coupons

This package provides coupons which can be used to register or renew IOTA Names.

## Using a Coupon

Coupons are used via the `Blake2b256` hash of their string code. For instance, if there is a coupon with the key "50% OFF", one could find the hash like so:

```
COUPON_HASH=$(echo "50% OFF" | b2sum -l 256 | cut -d ' ' -f1)
```

When registering a new name or renewing an existing one, a coupon may be provided by calling the `coupon_house::apply_coupon` function with the payment intent created by the IOTA-Names package. If the coupon is valid for the payment, then it will be applied and reduce the cost appropriately. Multiple coupons can be applied this way, if they are stackable.

## Rules

Coupons are created with a set of rules which limit their usage.

- Length: The length of the names for which the coupon can be applied
- Available Claims: The number of times this coupon can be used
- User: The specific address which can use this coupon
- Expiration: The expiration date and time for this coupon
- Years: The range of years (which the name will be reserved) for which this coupon can be used
- Can Stack: Whether this coupon can stack with other coupons
