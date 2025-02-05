// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module denylist::denylist_tests {
    use std::string::{utf8, String};

    use iota::test_scenario::{Self as ts, Scenario};

    use iotans::iotans::{Self, IotaNS};

    use denylist::denylist::{Self, DenyListAuth};

    const ADDR: address = @0x0;

    #[test]
    fun test() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iotans = scenario.take_shared<IotaNS>();
        let cap = iotans::create_admin_cap_for_testing(scenario.ctx());

        denylist::add_reserved_names(&mut iotans, &cap, some_reserved_names());
        denylist::add_blocked_names(&mut iotans, &cap, some_offensive_names());


        assert!(denylist::is_reserved_name(&iotans, utf8(b"test")), 0);
        assert!(denylist::is_reserved_name(&iotans, utf8(b"test2")), 0);
    
        assert!(denylist::is_blocked_name(&iotans, utf8(b"bad_test")), 0);

        assert!(!denylist::is_blocked_name(&iotans, utf8(b"example")), 0);

        assert!(!denylist::is_reserved_name(&iotans, utf8(b"example")), 0);

        iotans::burn_admin_cap_for_testing(cap);

        ts::return_shared(iotans);
        scenario_val.end();
    }

    #[test, expected_failure(abort_code = ::denylist::denylist::ENoWordsInList)]
    fun test_empty_addition_failure(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iotans = scenario.take_shared<IotaNS>();
        let cap = iotans::create_admin_cap_for_testing(scenario.ctx());

        denylist::add_reserved_names(&mut iotans, &cap, vector[]);

        abort 1337
    }

    // coverage.. :) 
    #[test, expected_failure(abort_code = ::denylist::denylist::ENoWordsInList)]
    fun test_empty_addition_blocked_failure(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iotans = scenario.take_shared<IotaNS>();
        let cap = iotans::create_admin_cap_for_testing(scenario.ctx());

        denylist::add_blocked_names(&mut iotans, &cap, vector[]);

        abort 1337
    }

    #[test]
    fun remove_blocked_word(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iotans = scenario.take_shared<IotaNS>();
        let cap = iotans::create_admin_cap_for_testing(scenario.ctx());

        denylist::add_blocked_names(&mut iotans, &cap, some_offensive_names());

        assert!(denylist::is_blocked_name(&iotans, utf8(b"bad_test")), 0);

        denylist::remove_blocked_names(&mut iotans, &cap, vector[utf8(b"bad_test")]);

        assert!(!denylist::is_blocked_name(&iotans, utf8(b"bad_test")), 0);

        iotans::burn_admin_cap_for_testing(cap);

        ts::return_shared(iotans);
        scenario_val.end();
    }

    #[test]
    fun remove_reserved_word(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iotans = scenario.take_shared<IotaNS>();
        let cap = iotans::create_admin_cap_for_testing(scenario.ctx());

        denylist::add_reserved_names(&mut iotans, &cap, some_reserved_names());

        let name = utf8(b"test");

        assert!(denylist::is_reserved_name(&iotans, name), 0);

        denylist::remove_reserved_names(&mut iotans, &cap, vector[name]);

        assert!(!denylist::is_reserved_name(&iotans, name), 0);

        iotans::burn_admin_cap_for_testing(cap);

        ts::return_shared(iotans);
        scenario_val.end();
    }

    // data preparation

    public fun test_init(): (Scenario) {
        let mut scenario = ts::begin(ADDR);
        {
            scenario.next_tx(ADDR);

            let (mut iotans, cap) = iotans::new_for_testing(scenario.ctx());

            iotans.authorize_app_for_testing<DenyListAuth>();

            denylist::setup(&mut iotans, &cap, scenario.ctx());

            iotans.share_for_testing();
        
            iotans::burn_admin_cap_for_testing(cap);
        };

        scenario
    }

    fun some_reserved_names(): vector<String> {
        let mut vec: vector<String> = vector::empty();

        vec.push_back(utf8(b"test"));
        vec.push_back(utf8(b"test2"));
        vec.push_back(utf8(b"test3"));
        vec
    }

    fun some_offensive_names(): vector<String> {
        let mut vec: vector<String> = vector::empty();
        vec.push_back(utf8(b"bad_test"));
        vec.push_back(utf8(b"bad_test2"));
        vec.push_back(utf8(b"bad_test3"));
        vec
    }
}
