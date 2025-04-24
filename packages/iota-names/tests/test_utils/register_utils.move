// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::register_utils;

use iota::{clock::Clock, coin, test_scenario::{Self, Scenario, ctx}};
use iota_names::{
    iota_names::IotaNames,
    iota_names_registration::IotaNamesRegistration,
    register::register
};
use std::string::String;

const IOTA_NAMES_ADDRESS: address = @0xA001;

public fun register_util<T>(
    scenario: &mut Scenario,
    domain_name: String,
    no_years: u8,
    amount: u64,
    clock_tick: u64,
): IotaNamesRegistration {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let payment = coin::mint_for_testing<T>(amount, scenario.ctx());
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    let nft = register<T>(
        &mut iota_names,
        domain_name,
        no_years,
        payment,
        &clock,
        scenario.ctx(),
    );

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iota_names);

    nft
}
