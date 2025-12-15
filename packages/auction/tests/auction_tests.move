// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
module iota_names::auction_tests;

use iota::clock::{Self, Clock};
use iota::coin::{Self, Coin};
use iota::iota::IOTA;
use iota::test_scenario::{Self, Scenario, ctx};
use iota_names::auction::{
    Self,
    AuctionAuth,
    place_bid,
    claim,
    AuctionHouse,
    start_auction_and_place_bid,
    total_balance,
    admin_finalize_auction,
    admin_try_finalize_auctions,
    admin_withdraw_funds,
    collect_winning_auction_fund
};
use iota_names::constants;
use iota_names::core_config;
use iota_names::name;
use iota_names::iota_names::{Self, IotaNames, AdminCap};
use iota_names::name_registration::NameRegistration;
use iota_names::test_init_utils;
use std::string::{String, utf8};

const IOTA_NAMES_ADDRESS: address = @0xA001;
const FIRST_ADDRESS: address = @0xB001;
const SECOND_ADDRESS: address = @0xB002;
const THIRD_ADDRESS: address = @0xB003;
const FIRST_NAME: vector<u8> = b"tes-t2.iota";
const SECOND_NAME: vector<u8> = b"tesq.iota";
const AUCTION_BIDDING_PERIOD_MS: u64 = 2 * 24 * 60 * 60 * 1000;
/// The amount of NANOS in 1 IOTA.
const NANOS_PER_IOTA: u64 = 1_000_000_000;

public fun test_init(): Scenario {
    let mut scenario_val = test_scenario::begin(IOTA_NAMES_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iota_names = iota_names::init_for_testing(ctx(scenario));
        iota_names.authorize_for_testing<AuctionAuth>();
        iota_names.share_for_testing();
        auction::init_for_testing(ctx(scenario));
        let clock = clock::create_for_testing(ctx(scenario));
        clock.share_for_testing();
    };
    {
        scenario.next_tx(IOTA_NAMES_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iota_names = scenario.take_shared<IotaNames>();

        test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, ctx(scenario));

        test_scenario::return_shared(iota_names);
        test_scenario::return_to_sender(scenario, admin_cap);
    };
    scenario_val
}

public fun start_auction_and_place_bid_util(
    scenario: &mut Scenario,
    sender: address,
    name: String,
    amount: u64,
) {
    scenario.next_tx(sender);
    let mut auction_house = scenario.take_shared<AuctionHouse>();
    let mut iota_names = scenario.take_shared<IotaNames>();
    let payment = coin::mint_for_testing<IOTA>(amount, ctx(scenario));
    let clock = scenario.take_shared<Clock>();

    auction_house.start_auction_and_place_bid(
        &mut iota_names,
        name,
        payment,
        &clock,
        ctx(scenario),
    );

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iota_names);
    test_scenario::return_shared(auction_house);
}

fun place_bid_util(
    scenario: &mut Scenario,
    sender: address,
    name: String,
    value: u64,
    clock_tick: u64,
) {
    scenario.next_tx(sender);
    let mut auction_house = scenario.take_shared<AuctionHouse>();
    let payment = coin::mint_for_testing<IOTA>(value, ctx(scenario));
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    auction_house.place_bid(name, payment, &clock, ctx(scenario));

    test_scenario::return_shared(clock);
    test_scenario::return_shared(auction_house);
}

public fun claim_util(
    scenario: &mut Scenario,
    sender: address,
    name: String,
    clock_tick: u64,
): NameRegistration {
    scenario.next_tx(sender);
    let mut auction_house = scenario.take_shared<AuctionHouse>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    let nft = auction_house.claim(name, &clock, ctx(scenario));

    test_scenario::return_shared(clock);
    test_scenario::return_shared(auction_house);
    nft
}

fun withdraw_util(scenario: &mut Scenario, sender: address): Coin<IOTA> {
    scenario.next_tx(sender);
    let returned_payment = test_scenario::take_from_sender<Coin<IOTA>>(scenario);
    returned_payment
}

fun admin_collect_fund_util(scenario: &mut Scenario, name: String, clock_tick: u64) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let mut auction_house = scenario.take_shared<AuctionHouse>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    collect_winning_auction_fund(
        &mut auction_house,
        name,
        &clock,
        ctx(scenario),
    );

    test_scenario::return_shared(clock);
    test_scenario::return_shared(auction_house);
}

fun admin_try_finalize_auction_util(scenario: &mut Scenario, name: String, clock_tick: u64) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut auction_house = scenario.take_shared<AuctionHouse>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    admin_finalize_auction(&admin_cap, &mut auction_house, name, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_shared(auction_house);
    test_scenario::return_to_sender(scenario, admin_cap);
}

fun admin_try_finalize_auctions_util(
    scenario: &mut Scenario,
    operation_limit: u64,
    clock_tick: u64,
) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut auction_house = scenario.take_shared<AuctionHouse>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    admin_try_finalize_auctions(
        &admin_cap,
        &mut auction_house,
        operation_limit,
        &clock,
    );

    test_scenario::return_shared(clock);
    test_scenario::return_shared(auction_house);
    test_scenario::return_to_sender(scenario, admin_cap);
}

fun admin_withdraw_funds_util(scenario: &mut Scenario): Coin<IOTA> {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut auction_house = scenario.take_shared<AuctionHouse>();

    let funds = admin_withdraw_funds(
        &admin_cap,
        &mut auction_house,
        ctx(scenario),
    );

    test_scenario::return_shared(auction_house);
    test_scenario::return_to_sender(scenario, admin_cap);
    funds
}

fun deauthorize_util(scenario: &mut Scenario) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut iota_names = scenario.take_shared<IotaNames>();

    iota_names::deauthorize<AuctionAuth>(&admin_cap, &mut iota_names);

    test_scenario::return_shared(iota_names);
    test_scenario::return_to_sender(scenario, admin_cap);
}

fun assert_balance(scenario: &mut Scenario, amount: u64) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let auction_house = scenario.take_shared<AuctionHouse>();
    assert!(total_balance(&auction_house) == amount, 0);
    test_scenario::return_shared(auction_house);
}

fun assert_auction(
    scenario: &mut Scenario,
    name: String,
    expected_start_ms: Option<u64>,
    expected_end_ms: Option<u64>,
    expected_bidder: Option<address>,
    expected_highest_amount: Option<u64>,
) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let auction_house = scenario.take_shared<AuctionHouse>();
    let (start_ms, end_ms, current_bidder, highest_amount) = auction_house.get_auction_metadata(
        name,
    );
    assert!(start_ms == expected_start_ms, 0);
    assert!(end_ms == expected_end_ms, 0);
    assert!(current_bidder == expected_bidder, 0);
    assert!(highest_amount == expected_highest_amount, 0);
    test_scenario::return_shared(auction_house);
}

public fun normal_auction_flow(scenario: &mut Scenario) {
    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    assert_auction(
        scenario,
        utf8(FIRST_NAME),
        option::some(0),
        option::some(AUCTION_BIDDING_PERIOD_MS),
        option::some(FIRST_ADDRESS),
        option::some(1200 * NANOS_PER_IOTA),
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        10,
    );
    assert_auction(
        scenario,
        utf8(FIRST_NAME),
        option::some(0),
        option::some(AUCTION_BIDDING_PERIOD_MS),
        option::some(SECOND_ADDRESS),
        option::some(1210 * NANOS_PER_IOTA),
    );

    let nft = claim_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert!(nft.name() == name::new(utf8(FIRST_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == constants::year_ms(), 0);
    nft.burn_for_testing();

    let payment = withdraw_util(scenario, FIRST_ADDRESS);
    assert!(coin::value(&payment) == 1200 * NANOS_PER_IOTA, 0);
    coin::burn_for_testing(payment);
    assert_balance(scenario, 1210 * NANOS_PER_IOTA);

    let funds = admin_withdraw_funds_util(scenario);
    assert!(coin::value(&funds) == 1210 * NANOS_PER_IOTA, 0);
    assert_balance(scenario, 0);
    coin::burn_for_testing(funds);
}

#[test]
fun test_normal_auction_flow() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    normal_auction_flow(scenario);

    scenario_val.end();
}

#[test, expected_failure(abort_code = iota::dynamic_field::EFieldDoesNotExist)]
fun test_claim_aborts_if_winner_claims_twice() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        0,
    );

    let nft = claim_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    nft.burn_for_testing();
    let nft = claim_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test]
fun test_current_bidder_can_place_bid() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        0,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1220 * NANOS_PER_IOTA,
        0,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EBidTooLow)]
fun test_place_bid_aborts_if_value_is_too_low() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
        0,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::ENotWinner)]
fun test_non_winner_cannot_claim() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        0,
    );

    let nft = claim_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test]
fun test_admin_try_finalize_auction() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        0,
    );
    place_bid_util(
        scenario,
        THIRD_ADDRESS,
        utf8(FIRST_NAME),
        1220 * NANOS_PER_IOTA,
        1,
    );

    admin_try_finalize_auction_util(
        scenario,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert_balance(scenario, 1220 * NANOS_PER_IOTA);

    let nft = test_scenario::take_from_address<NameRegistration>(
        scenario,
        THIRD_ADDRESS,
    );
    assert!(nft.name() == name::new(utf8(FIRST_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == constants::year_ms(), 0);
    nft.burn_for_testing();

    let payment = test_scenario::take_from_address<Coin<IOTA>>(
        scenario,
        SECOND_ADDRESS,
    );
    assert!(coin::value(&payment) == 1210 * NANOS_PER_IOTA, 0);
    coin::burn_for_testing(payment);

    let payment = test_scenario::take_from_address<Coin<IOTA>>(
        scenario,
        FIRST_ADDRESS,
    );
    assert!(coin::value(&payment) == 1200 * NANOS_PER_IOTA, 0);
    coin::burn_for_testing(payment);
    assert_balance(scenario, 1220 * NANOS_PER_IOTA);

    scenario_val.end();
}

#[test]
fun test_admin_try_finalize_auction_2_auctions() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    start_auction_and_place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(SECOND_NAME),
        1210 * NANOS_PER_IOTA,
    );

    admin_try_finalize_auctions_util(
        scenario,
        4,
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert_balance(scenario, 2410 * NANOS_PER_IOTA);

    let nft = test_scenario::take_from_address<NameRegistration>(
        scenario,
        SECOND_ADDRESS,
    );
    assert!(nft.name() == name::new(utf8(SECOND_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == constants::year_ms(), 0);
    nft.burn_for_testing();

    let nft = test_scenario::take_from_address<NameRegistration>(
        scenario,
        FIRST_ADDRESS,
    );
    assert!(nft.name() == name::new(utf8(FIRST_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == constants::year_ms(), 0);
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EAuctionNotEnded)]
fun test_admin_try_finalize_auction_too_early() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );

    admin_try_finalize_auction_util(scenario, utf8(FIRST_NAME), 0);

    scenario_val.end();
}

#[test]
fun test_admin_try_finalize_auctions_too_early() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    admin_try_finalize_auctions_util(scenario, 3, 0);
    assert_balance(scenario, 0);

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EAuctionEnded)]
fun test_place_bid_aborts_if_too_late() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        AUCTION_BIDDING_PERIOD_MS + 1,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::ENoProfits)]
fun test_admin_withdraw_funds_aborts_if_no_profits() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let funds = admin_withdraw_funds_util(scenario);

    coin::burn_for_testing(funds);

    scenario_val.end();
}

#[test, expected_failure(abort_code = core_config::EInvalidTln)]
fun test_start_auction_aborts_with_wrong_tln() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(b"test.move"),
        1200 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = core_config::EInvalidLength)]
fun test_start_auction_aborts_if_name_too_short() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(b"tt.iota"),
        1200 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = name::EInvalidName)]
fun test_start_auction_aborts_if_name_too_long() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(
            b"g2bst97onsyl8gwo5brfglcb-obh8i7p01lz5ccscd6zxx4qn7wnv8b1in5sectj8s.iota",
        ),
        1200 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = name::EInvalidName)]
fun test_start_auction_aborts_if_name_starts_with_dash() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(b"-test.iota"),
        1200 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = name::EInvalidName)]
fun test_start_auction_aborts_if_name_ends_with_dash() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(b"test-.iota"),
        1200 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = name::EInvalidName)]
fun test_start_auction_aborts_if_name_contains_uppercase_characters() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(b"ttABC.iota"),
        1200 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EAuctionNotStarted)]
fun test_place_bid_aborts_if_auction_not_started() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        0,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EInitialBidTooLow)]
fun test_start_auction_aborts_if_not_enough_fee() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(b"test.iota"),
        10 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test]
fun test_admin_collect_fund() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        AUCTION_BIDDING_PERIOD_MS,
    );
    assert_balance(scenario, 0);
    admin_collect_fund_util(
        scenario,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert_balance(scenario, 1210 * NANOS_PER_IOTA);

    let nft = claim_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert!(nft.name() == name::new(utf8(FIRST_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == constants::year_ms(), 0);
    nft.burn_for_testing();

    let payment = withdraw_util(scenario, FIRST_ADDRESS);
    assert!(coin::value(&payment) == 1200 * NANOS_PER_IOTA, 0);
    coin::burn_for_testing(payment);
    assert_balance(scenario, 1210 * NANOS_PER_IOTA);

    let funds = admin_withdraw_funds_util(scenario);
    assert!(coin::value(&funds) == 1210 * NANOS_PER_IOTA, 0);
    assert_balance(scenario, 0);
    coin::burn_for_testing(funds);

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EAuctionNotEnded)]
fun test_admin_collect_fund_aborts_if_too_early() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    admin_collect_fund_util(scenario, utf8(FIRST_NAME), 0);

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_start_auction_and_place_bid_aborts_if_auction_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    
    deauthorize_util(scenario);
    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test]
fun test_place_bid_and_claim_and_withdraw_works_even_if_auction_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    deauthorize_util(scenario);
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        10,
    );
    assert_auction(
        scenario,
        utf8(FIRST_NAME),
        option::some(0),
        option::some(AUCTION_BIDDING_PERIOD_MS),
        option::some(SECOND_ADDRESS),
        option::some(1210 * NANOS_PER_IOTA),
    );

    let nft = claim_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert!(nft.name() == name::new(utf8(FIRST_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == constants::year_ms(), 0);
    nft.burn_for_testing();

    let payment = withdraw_util(scenario, FIRST_ADDRESS);
    assert!(coin::value(&payment) == 1200 * NANOS_PER_IOTA, 0);
    coin::burn_for_testing(payment);
    assert_balance(scenario, 1210 * NANOS_PER_IOTA);

    let funds = admin_withdraw_funds_util(scenario);
    assert!(coin::value(&funds) == 1210 * NANOS_PER_IOTA, 0);
    assert_balance(scenario, 0);
    coin::burn_for_testing(funds);

    scenario_val.end();
}

#[test]
fun test_admin_try_finalize_auction_works_even_if_auction_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        0,
    );
    place_bid_util(
        scenario,
        THIRD_ADDRESS,
        utf8(FIRST_NAME),
        1220 * NANOS_PER_IOTA,
        1,
    );

    deauthorize_util(scenario);
    admin_try_finalize_auction_util(
        scenario,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert_balance(scenario, 1220 * NANOS_PER_IOTA);

    let nft = test_scenario::take_from_address<NameRegistration>(
        scenario,
        THIRD_ADDRESS,
    );
    assert!(nft.name() == name::new(utf8(FIRST_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == constants::year_ms(), 0);
    nft.burn_for_testing();

    let payment = test_scenario::take_from_address<Coin<IOTA>>(
        scenario,
        SECOND_ADDRESS,
    );
    assert!(coin::value(&payment) == 1210 * NANOS_PER_IOTA, 0);
    coin::burn_for_testing(payment);

    let payment = test_scenario::take_from_address<Coin<IOTA>>(
        scenario,
        FIRST_ADDRESS,
    );
    assert!(coin::value(&payment) == 1200 * NANOS_PER_IOTA, 0);
    coin::burn_for_testing(payment);
    assert_balance(scenario, 1220 * NANOS_PER_IOTA);

    scenario_val.end();
}

#[test]
fun test_admin_collect_fund_even_if_auction_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        1210 * NANOS_PER_IOTA,
        AUCTION_BIDDING_PERIOD_MS,
    );
    assert_balance(scenario, 0);
    deauthorize_util(scenario);
    admin_collect_fund_util(
        scenario,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert_balance(scenario, 1210 * NANOS_PER_IOTA);

    let nft = claim_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS + 1,
    );
    assert!(nft.name() == name::new(utf8(FIRST_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == constants::year_ms(), 0);
    nft.burn_for_testing();

    let payment = withdraw_util(scenario, FIRST_ADDRESS);
    assert!(payment.value() == 1200 * NANOS_PER_IOTA, 0);
    payment.burn_for_testing();
    assert_balance(scenario, 1210 * NANOS_PER_IOTA);

    let funds = admin_withdraw_funds_util(scenario);
    assert!(funds.value() == 1210 * NANOS_PER_IOTA, 0);
    assert_balance(scenario, 0);
    funds.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EBidTooLow)]
fun test_overbid_less_than_10_IOTA() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        100 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        100 * NANOS_PER_IOTA + 100,
        0,
    );

    scenario_val.end();
}

#[test]
fun test_overbid_of_10_IOTA() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        100 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        110 * NANOS_PER_IOTA,
        0,
    );

    scenario_val.end();
}

#[test]
fun test_overbid_of_10_IOTA_and_1_NANO() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        100 * NANOS_PER_IOTA,
    );
    place_bid_util(
        scenario,
        SECOND_ADDRESS,
        utf8(FIRST_NAME),
        110 * NANOS_PER_IOTA + 1,
        0,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EAuctionStarted)]
fun test_auction_started() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        100 * NANOS_PER_IOTA,
    );
    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        100 * NANOS_PER_IOTA,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = auction::EAuctionNotEnded)]
fun test_auction_not_ended() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        100 * NANOS_PER_IOTA,
    );
    let nft = claim_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        AUCTION_BIDDING_PERIOD_MS,
    );

    nft.burn_for_testing();

    scenario_val.end();
}

#[test]
fun test_auction_metadata_none() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );
    assert_auction(
        scenario,
        utf8(SECOND_NAME),
        option::none(),
        option::none(),
        option::none(),
        option::none(),
    );

    scenario_val.end();
}

#[test]
fun test_admin_try_finalize_auctions_zero_operations() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    start_auction_and_place_bid_util(
        scenario,
        FIRST_ADDRESS,
        utf8(FIRST_NAME),
        1200 * NANOS_PER_IOTA,
    );

    admin_try_finalize_auctions_util(
        scenario,
        0,
        AUCTION_BIDDING_PERIOD_MS + 1,
    );

    assert_balance(scenario, 0);

    scenario_val.end();
}
