// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module subdomains::subdomain_tests {
    use std::string::{String, utf8};

    use iota::{test_scenario::{Self as ts, Scenario, ctx}, clock::{Self, Clock}};

    use iotans::{
        domain, 
        constants::{grace_period_ms, year_ms}, 
        iotans::{Self, IOTANS, AdminCap}, 
        registry::{Self, Registry}, 
        iotans_registration::{Self, IotansRegistration}, 
        subdomain_registration::{Self, SubDomainRegistration}, 
        registry_tests::{burn_nfts}
    };
    
    use denylist::denylist;

    use subdomains::{
        config,
        subdomains::{Self, SubDomains}
    };

    const USER_ADDRESS: address = @0x01;
    const TEST_ADDRESS: address = @0x02;

    const MIN_SUBDOMAIN_DURATION: u64 = 24 * 60 * 60 * 1000; // 1 day


    #[test]
    /// A test scenario
    fun test_multiple_operation_cases() {

        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;

        let parent = create_sld_name(utf8(b"test.iota"), scenario);

        let mut child = create_node_subdomain(&parent, utf8(b"node.test.iota"), MIN_SUBDOMAIN_DURATION, true, true, scenario);

        create_leaf_subdomain(&parent, utf8(b"leaf.test.iota"), TEST_ADDRESS, scenario);
        remove_leaf_subdomain(&parent, utf8(b"leaf.test.iota"), scenario);

        // Create a node name with the same name as the leaf that was deleted.
        let another_child = create_node_subdomain(&parent, utf8(b"leaf.test.iota"), MIN_SUBDOMAIN_DURATION, true, true, scenario);

        let nested = create_node_subdomain(subdomain_registration::nft(&child), utf8(b"nested.node.test.iota"), MIN_SUBDOMAIN_DURATION, true, true, scenario);

        // extend node's subdomain expiration to the limit.
        extend_node_subdomain(&mut child, iotans_registration::expiration_timestamp_ms(&parent), scenario);

        // update subdomain's setup for testing
        update_subdomain_setup(&parent, utf8(b"node.test.iota"), false, false, scenario);

        increment_clock(year_ms() +1, scenario);

        burn_subdomain(child, scenario);
        burn_subdomain(nested, scenario);
        burn_subdomain(another_child, scenario);

        burn_nfts(vector[parent]);
        ts::end(scenario_val);
    }

    #[test, expected_failure(abort_code=::subdomains::subdomains::EInvalidExpirationDate)]
    fun expiration_past_parents_expiration() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        let parent = create_sld_name(utf8(b"test.iota"), scenario);

        let _child = create_node_subdomain(&parent, utf8(b"node.test.iota"), iotans_registration::expiration_timestamp_ms(&parent) + 1, true, true, scenario);

        abort 1337
    }

    #[test, expected_failure(abort_code=::subdomains::config::EInvalidParent)]
    /// tries to create a child node using an invalid parent.
    fun invalid_parent_failure(){
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        let parent = create_sld_name(utf8(b"test.iota"), scenario);

        let _child = create_node_subdomain(&parent, utf8(b"node.example.iota"), iotans_registration::expiration_timestamp_ms(&parent), true, true, scenario);

        abort 1337  
    }


    #[test, expected_failure(abort_code=::subdomains::subdomains::ECreationDisabledForSubDomain)]
    fun tries_to_create_subdomain_with_disallowed_node_parent() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        let parent = create_sld_name(utf8(b"test.iota"), scenario);

        let child = create_node_subdomain(&parent, utf8(b"node.test.iota"), iotans_registration::expiration_timestamp_ms(&parent), false, true, scenario);

        let child_nft = subdomain_registration::nft(&child);
        let _nested = create_node_subdomain(child_nft, utf8(b"test.node.test.iota"), iotans_registration::expiration_timestamp_ms(child_nft), false, true, scenario);

        abort 1337  
    }

    #[test, expected_failure(abort_code=::subdomains::subdomains::EExtensionDisabledForSubDomain)]
    fun tries_to_extend_without_permissions() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        let parent = create_sld_name(utf8(b"test.iota"), scenario);

        let mut child = create_node_subdomain(&parent, utf8(b"node.test.iota"), MIN_SUBDOMAIN_DURATION, false, false, scenario);

        extend_node_subdomain(&mut child, 2, scenario);

        abort 1337  
    }

    #[test, expected_failure(abort_code=::subdomains::subdomains::EParentChanged)]
    fun tries_to_extend_while_parent_changed() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        let parent = create_sld_name(utf8(b"test.iota"), scenario);

        // child is an expired name ofc.
        let mut child = create_node_subdomain(&parent, utf8(b"node.test.iota"), MIN_SUBDOMAIN_DURATION, true, true, scenario);

        increment_clock(iotans_registration::expiration_timestamp_ms(&parent) +grace_period_ms() + 1 , scenario);

        let _parent_w_different_owner = create_sld_name(utf8(b"test.iota"), scenario);

        // any extension.
        extend_node_subdomain(&mut child, 2, scenario);

        abort 1337  
    }
    
    #[test, expected_failure(abort_code=::iotans::registry::ERecordExpired)]
    fun tries_to_use_expired_subdomain_to_create_new() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        let parent = create_sld_name(utf8(b"test.iota"), scenario);

        let child = create_node_subdomain(&parent, utf8(b"node.test.iota"), MIN_SUBDOMAIN_DURATION, true, true, scenario);

        increment_clock(MIN_SUBDOMAIN_DURATION +1, scenario);
        create_leaf_subdomain(subdomain_registration::nft(&child), utf8(b"node.node.test.iota"), TEST_ADDRESS, scenario);

        abort 1337  
    }

    #[test, expected_failure(abort_code=::subdomains::subdomains::EInvalidExpirationDate)]
    fun tries_to_create_too_short_subdomain() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        let parent = create_sld_name(utf8(b"test.iota"), scenario);

        let _child = create_node_subdomain(&parent, utf8(b"node.test.iota"), 1, true, true, scenario);

        abort 1337  
    }

    #[test, expected_failure(abort_code=::subdomains::config::EInvalidParent)]
    fun tries_to_created_nested_leaf_subdomain() {
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        let parent = create_sld_name(utf8(b"test.iota"), scenario);
        create_leaf_subdomain(&parent, utf8(b"node.node.test.iota"), TEST_ADDRESS, scenario);

        abort 1337  
    }



    // == Helpers == 

    public fun test_init(): Scenario {
        let mut scenario_val = ts::begin(USER_ADDRESS);
        let scenario = &mut scenario_val;
        {
            let mut iotans = iotans::init_for_testing(ctx(scenario));
            iotans::authorize_app_for_testing<SubDomains>(&mut iotans);
            iotans::share_for_testing(iotans);
            let clock = clock::create_for_testing(ctx(scenario));
            clock::share_for_testing(clock);
        };
        {
            ts::next_tx(scenario, USER_ADDRESS);
            let admin_cap = ts::take_from_sender<AdminCap>(scenario);
            let mut iotans = ts::take_shared<IOTANS>(scenario);
            iotans::add_config(&admin_cap, &mut iotans, config::default());

            registry::init_for_testing(&admin_cap, &mut iotans, ctx(scenario));
            denylist::setup(&mut iotans, &admin_cap, ctx(scenario));

            ts::return_shared(iotans);
            ts::return_to_sender(scenario, admin_cap);
        };
        scenario_val
    }

    /// Get the active registry of the current scenario. (mutable, so we can add extra names ourselves)
    public fun registry_mut(iotans: &mut IOTANS): &mut Registry {

        let registry_mut = iotans::app_registry_mut<SubDomains, Registry>(subdomains::auth_for_testing(), iotans);

        registry_mut
    }
    
    /// Create a regular name to help with our tests.
    public fun create_sld_name(name: String, scenario: &mut Scenario): IotansRegistration {
        ts::next_tx(scenario, USER_ADDRESS);
        let mut iotans = ts::take_shared<IOTANS>(scenario);
        let clock = ts::take_shared<Clock>(scenario);
        let registry_mut = registry_mut(&mut iotans);

        let parent = registry::add_record(registry_mut, domain::new(name), 1, &clock, ctx(scenario));

        ts::return_shared(clock);
        ts::return_shared(iotans);
        parent
    } 

    /// Create a leaf subdomain
    public fun create_leaf_subdomain(parent: &IotansRegistration, name: String, target: address, scenario: &mut Scenario) {
        ts::next_tx(scenario, USER_ADDRESS);
        let mut iotans = ts::take_shared<IOTANS>(scenario);
        let clock = ts::take_shared<Clock>(scenario);

        subdomains::new_leaf(&mut iotans, parent, &clock, name, target, ctx(scenario));

        ts::return_shared(iotans);
        ts::return_shared(clock);
    }

    /// Remove a leaf subdomain
    public fun remove_leaf_subdomain(parent: &IotansRegistration, name: String, scenario: &mut Scenario) {
        ts::next_tx(scenario, USER_ADDRESS);
        let mut iotans = ts::take_shared<IOTANS>(scenario);
        let clock = ts::take_shared<Clock>(scenario);
        
        subdomains::remove_leaf(&mut iotans, parent, &clock, name);

        ts::return_shared(iotans);
        ts::return_shared(clock);
    }

    /// Create a node subdomain
    public fun create_node_subdomain(parent: &IotansRegistration, name: String, expiration: u64, allow_creation: bool, allow_extension: bool, scenario: &mut Scenario): SubDomainRegistration {
        ts::next_tx(scenario, USER_ADDRESS);
        let mut iotans = ts::take_shared<IOTANS>(scenario);
        let clock = ts::take_shared<Clock>(scenario);

        let nft = subdomains::new(&mut iotans, parent, &clock, name, expiration, allow_creation, allow_extension, ctx(scenario));

        ts::return_shared(iotans);
        ts::return_shared(clock);

        nft
    }

    /// Extend a node subdomain's expiration.
    public fun extend_node_subdomain(nft: &mut SubDomainRegistration, expiration: u64, scenario: &mut Scenario) {
        ts::next_tx(scenario, USER_ADDRESS);
        let mut iotans = ts::take_shared<IOTANS>(scenario);
        let clock = ts::take_shared<Clock>(scenario);

        subdomains::extend_expiration(&mut iotans, nft, expiration);

        ts::return_shared(iotans);
        ts::return_shared(clock);
    }

    public fun update_subdomain_setup(parent: &IotansRegistration, subdomain: String, allow_creation: bool, allow_extension: bool, scenario: &mut Scenario) {
        ts::next_tx(scenario, USER_ADDRESS);
        let mut iotans = ts::take_shared<IOTANS>(scenario);
        let clock = ts::take_shared<Clock>(scenario);


        subdomains::edit_setup(&mut iotans, parent, &clock, subdomain, allow_creation, allow_extension);


        ts::return_shared(iotans);
        ts::return_shared(clock);
    } 

    public fun burn_subdomain(nft: SubDomainRegistration, scenario: &mut Scenario) {
        ts::next_tx(scenario, USER_ADDRESS);
        let mut iotans = ts::take_shared<IOTANS>(scenario);
        let clock = ts::take_shared<Clock>(scenario);

        subdomains::burn(&mut iotans, nft, &clock);

        ts::return_shared(iotans);
        ts::return_shared(clock);
    } 


    public fun increment_clock(to: u64, scenario: &mut Scenario){
        ts::next_tx(scenario, USER_ADDRESS);
        let mut clock = ts::take_shared<Clock>(scenario);
        clock::increment_for_testing(&mut clock, to);
        ts::return_shared(clock);
    }

}
