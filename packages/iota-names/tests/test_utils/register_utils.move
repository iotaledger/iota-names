// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::register_utils;

use std::string::String;
use iota::clock::Clock;
use iota::coin;
use iota::test_scenario::{Self, Scenario, ctx};
use iota_names::register::register;
use iota_names::iota_names::IotaNames;
use iota_names::iota_names_registration::IotaNamesRegistration;

const IOTANS_ADDRESS: address = @0xA001;

public fun register_util<T>(
    scenario: &mut Scenario,
    domain_name: String,
    no_years: u8,
    amount: u64,
    clock_tick: u64,
): IotaNamesRegistration {
    scenario.next_tx(IOTANS_ADDRESS);
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
