// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
/// Testing strategy:
///
/// - create config and make sure the values can be retrieved and updated
/// - price calculation should be correct for each length and duration
/// - config must save the user from making a dummy mistake and provide
///   the basic validation for parameters (years, other settings)
///
module iota_names::config_tests;

use iota::ecdsa_k1;
use iota_names::config::{Self, Config};

// consts for fees (starting prices)
const THREE: u64 = 9_000_000_000; // 9 IOTA
const FOUR: u64 = 5_000_000_000; // 5 IOTA
const FIVE_PLUS: u64 = 2_000_000_000; // 2 IOTA

#[test]
fun create_and_update_config() {
    let mut config = default();

    // check that the values are set correctly in the `new` function
    assert!(config.three_char_price() == THREE, 0);
    assert!(config.four_char_price() == FOUR, 0);
    assert!(config.five_plus_char_price() == FIVE_PLUS, 0);

    // update each of the values and make sure they are updated
    config.set_three_char_price(4_000_000_000);
    config.set_four_char_price(3_000_000_000);
    config.set_five_plus_char_price(1_000_000_000);

    // check that the updated values match the new ones
    assert!(config.three_char_price() == 4_000_000_000, 0);
    assert!(config.four_char_price() == 3_000_000_000, 0);
    assert!(config.five_plus_char_price() == 1_000_000_000, 0);
}

#[test]
fun calculate_price() {
    let config = default();

    // test each of the length ranges and 1 year duration
    assert!(THREE == config.calculate_price(3, 1), 0);
    assert!(FOUR == config.calculate_price(4, 1), 0);
    assert!(FIVE_PLUS == config.calculate_price(5, 1), 0);
    assert!(FIVE_PLUS == config.calculate_price(6, 1), 0);

    // test each of the length ranges and 2 year duration
    assert!(THREE * 2 == config.calculate_price(3, 2), 0);
    assert!(FOUR * 2 == config.calculate_price(4, 2), 0);
    assert!(FIVE_PLUS * 2 == config.calculate_price(5, 2), 0);
    assert!(FIVE_PLUS * 2 == config.calculate_price(6, 2), 0);
}

#[test]
#[expected_failure(abort_code = iota_names::config::ENoYears)]
fun calculate_price_years_fail() {
    default().calculate_price(3, 0);
}

#[test]
#[expected_failure(abort_code = iota_names::config::ELabelTooShort)]
fun calculate_price_length_min_fail() {
    default().calculate_price(2, 1);
}

#[test]
#[expected_failure(abort_code = iota_names::config::ELabelTooLong)]
fun calculate_price_length_max_fail() {
    default().calculate_price(255, 1);
}

// create a default configuration for tests
fun default(): Config {
    config::new(
        THREE, // 3 symbol length (9 IOTA)
        FOUR, // 4 symbol length (5 IOTA)
        FIVE_PLUS, // 5 symbol length (2 IOTA)
    )
}
