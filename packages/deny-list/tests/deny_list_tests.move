// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module deny_list::deny_list_tests {
    use std::string::{utf8, String};

    use iota::test_scenario::{Self as ts, Scenario};

    use iota_names::iota_names::{Self, IotaNames};

    use deny_list::deny_list::{Self, DenyListAuth};

    const ADDR: address = @0x0;

    #[test]
    fun test() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iota_names = scenario.take_shared<IotaNames>();
        let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

        deny_list::add_reserved_names(&mut iota_names, &cap, some_reserved_names());
        deny_list::add_blocked_names(&mut iota_names, &cap, some_offensive_names());


        assert!(deny_list::is_reserved_name(&iota_names, utf8(b"test")), 0);
        assert!(deny_list::is_reserved_name(&iota_names, utf8(b"test2")), 0);
    
        assert!(deny_list::is_blocked_name(&iota_names, utf8(b"bad_test")), 0);

        assert!(!deny_list::is_blocked_name(&iota_names, utf8(b"example")), 0);

        assert!(!deny_list::is_reserved_name(&iota_names, utf8(b"example")), 0);

        iota_names::burn_admin_cap_for_testing(cap);

        ts::return_shared(iota_names);
        scenario_val.end();
    }

    #[test, expected_failure(abort_code = ::deny_list::deny_list::ENoWordsInList)]
    fun test_empty_addition_failure(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iota_names = scenario.take_shared<IotaNames>();
        let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

        deny_list::add_reserved_names(&mut iota_names, &cap, vector[]);

        abort 1337
    }


    #[test, expected_failure(abort_code = ::deny_list::deny_list::ENoWordsInList)]
    fun test_empty_addition_blocked_failure(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iota_names = scenario.take_shared<IotaNames>();
        let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

        deny_list::add_blocked_names(&mut iota_names, &cap, vector[]);

        abort 1337
    }

    #[test]
    fun remove_blocked_word(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iota_names = scenario.take_shared<IotaNames>();
        let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

        deny_list::add_blocked_names(&mut iota_names, &cap, some_offensive_names());

        assert!(deny_list::is_blocked_name(&iota_names, utf8(b"bad_test")), 0);

        deny_list::remove_blocked_names(&mut iota_names, &cap, vector[utf8(b"bad_test")]);

        assert!(!deny_list::is_blocked_name(&iota_names, utf8(b"bad_test")), 0);

        iota_names::burn_admin_cap_for_testing(cap);

        ts::return_shared(iota_names);
        scenario_val.end();
    }

    #[test]
    fun remove_reserved_word(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        scenario.next_tx(ADDR);
        let mut iota_names = scenario.take_shared<IotaNames>();
        let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

        deny_list::add_reserved_names(&mut iota_names, &cap, some_reserved_names());

        let name = utf8(b"test");

        assert!(deny_list::is_reserved_name(&iota_names, name), 0);

        deny_list::remove_reserved_names(&mut iota_names, &cap, vector[name]);

        assert!(!deny_list::is_reserved_name(&iota_names, name), 0);

        iota_names::burn_admin_cap_for_testing(cap);

        ts::return_shared(iota_names);
        scenario_val.end();
    }

    // data preparation

    public fun test_init(): (Scenario) {
        let mut scenario = ts::begin(ADDR);
        {
            scenario.next_tx(ADDR);

            let (mut iota_names, cap) = iota_names::new_for_testing(scenario.ctx());

            iota_names.authorize_app_for_testing<DenyListAuth>();

            deny_list::setup(&mut iota_names, &cap, scenario.ctx());

            iota_names.share_for_testing();
        
            iota_names::burn_admin_cap_for_testing(cap);
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
