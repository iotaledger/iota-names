#[test_only]
module iotans::day_one_tests {
    use std::string::{utf8, String};
    use iota::{
        clock::{Self, Clock},
        test_scenario::{Self, Scenario, ctx},
    };

    use iotans::{
        iotans_registration::{Self as nft, IotansRegistration},
        domain,
        registry,
        iotans::{Self, IotaNS, AdminCap},
    };

    use day_one::{
        day_one::{Self, DayOne},
        bogo::{Self, BogoApp},
    };

    const IOTANS_ADDRESS: address = @0xA001;
    const USER_ADDRESS: address = @0xA002;

    fun test_init(): Scenario {
        let mut scenario_val = test_scenario::begin(IOTANS_ADDRESS);
        let scenario = &mut scenario_val;
        {
            let mut iotans = iotans::init_for_testing(ctx(scenario));
            iotans.authorize_app_for_testing<BogoApp>();
            iotans.share_for_testing();
            let clock = clock::create_for_testing(ctx(scenario));
            clock.share_for_testing();
        };
        {
            scenario.next_tx(IOTANS_ADDRESS);
            let admin_cap = scenario.take_from_sender<AdminCap>();
            let mut iotans = scenario.take_shared<IotaNS>();

            registry::init_for_testing(
                &admin_cap,
                &mut iotans,
                ctx(scenario)
            );

            test_scenario::return_shared(iotans);
            scenario.return_to_sender(admin_cap);
        };
        scenario_val
    }

    #[test]
    fun test_e2e() {
        // an e2e scenario were we just purchase 3 domains normally using 3 registered ones.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let clock = scenario.take_shared<Clock>();
        let (
            mut domain1,
            mut domain2,
            mut domain3,
            mut day_one
        ) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();

        let new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain1,
            utf8(b"wow.iota"),
            &clock,
            ctx(scenario)
        );
        let new_name_2 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain2,
            utf8(b"wow1.iota"),
            &clock,
            ctx(scenario)
        );
        let new_name_3 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain3,
            utf8(b"wow11.iota"),
            &clock,
            ctx(scenario)
        );

        // we can verify that day one got activated here.
        assert!(day_one::is_active(&day_one), 0);

        burn_domain(new_name_1);
        burn_domain(new_name_2);
        burn_domain(new_name_3);
        // clean up all these domains.
        cleanup(domain1, domain2, domain3, day_one);

        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    #[test]
    #[expected_failure(abort_code = bogo::EDomainAlreadyUsed)]
    fun failure_test_domain_already_used() {
        // tries to reuse the same IotansRegistration for a second time.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let clock = scenario.take_shared<Clock>();
        let (
            mut domain1,
            domain2,
            domain3,
            mut day_one
        ) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();

        let new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain1,
            utf8(b"wow.iota"),
            &clock,
            ctx(scenario)
        );
        let new_name_2 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain1,
            utf8(b"wop.iota"),
            &clock,
            ctx(scenario)
        );
        burn_domain(new_name_1);
        burn_domain(new_name_2);

        cleanup(domain1, domain2, domain3, day_one);
        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    #[test]
    #[expected_failure(abort_code = bogo::EDomainAlreadyUsed)]
    fun failure_test_free_minted_domain_use() {
        // an e2e scenario were we just purchase 3 domains normally using 3 registered ones.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let clock = scenario.take_shared<Clock>();
        let (
            mut domain1,
            domain2,
            domain3,
            mut day_one
        ) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();

        let mut new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain1,
            utf8(b"wow.iota"),
            &clock,
            ctx(scenario)
        );
        let new_name_2 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut new_name_1,
            utf8(b"wop.iota"),
            &clock,
            ctx(scenario)
        );

        burn_domain(new_name_1);
        burn_domain(new_name_2);

        // clean up all these domains.
        cleanup(domain1, domain2, domain3, day_one);

        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    #[test]
    #[expected_failure(abort_code = bogo::ESizeMissMatch)]
    fun failure_test_length_missmatch() {
        // Tries to register a 4 letter domain while presenting a 3 letter one.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let clock = scenario.take_shared<Clock>();
        let (
            mut domain1,
            domain2,
            domain3,
            mut day_one
        ) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();

        let new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain1,
            utf8(b"wow1.iota"),
            &clock,
            ctx(scenario)
        );
        burn_domain(new_name_1);

        // clean up all these domains.
        cleanup(domain1, domain2, domain3, day_one);

        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    #[test]
    #[expected_failure(abort_code = bogo::ENotPurchasedInAuction)]
    fun failure_test_domain_not_bought_in_auction() {
        // tries to use a fresh domain to get another one for free.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let mut clock = scenario.take_shared<Clock>();
        let (domain1, domain2, domain3, mut day_one) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();

        // increment the clock by a lot.
        clock::increment_for_testing(
            &mut clock,
            bogo::last_valid_expiration()
        );

        let mut fresh_domain = new_domain(
            utf8(b"exp.iota"),
            1,
            &clock,
            ctx(scenario)
        );
        let new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut fresh_domain,
            utf8(b"wow.iota"),
            &clock,
            ctx(scenario)
        );

        burn_domain(new_name_1);
        burn_domain(fresh_domain);

        // clean up all these domains.
        cleanup(domain1, domain2, domain3, day_one);

        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    #[test]
    #[expected_failure(abort_code = bogo::ESizeMissMatch)]
    fun failure_test_length_missmatch_2() {
        // Tries to claim a 3 letter name using a 4 letter domain.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let clock = scenario.take_shared<Clock>();
        let (
            domain1,
            mut domain2,
            domain3,
            mut day_one
        ) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();

        // using a 4 digit domain and trying to get a 3 digit one.
        let new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain2,
            utf8(b"wow.iota"),
            &clock,
            ctx(scenario)
        );
        burn_domain(new_name_1);

        // clean up all these domains.
        cleanup(domain1, domain2, domain3, day_one);

        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    #[test]
    #[expected_failure(abort_code = bogo::ESizeMissMatch)]
    fun failure_test_length_missmatch_3() {
        // tries to get a 4 digit name using a 5 digit one.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let clock = scenario.take_shared<Clock>();
        let (
            domain1,
            domain2,
            mut domain3,
            mut day_one
        ) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();

        let new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain3,
            utf8(b"woww.iota"),
            &clock,
            ctx(scenario)
        );
        burn_domain(new_name_1);

        // clean up all these domains.
        cleanup(domain1, domain2, domain3, day_one);

        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    #[test]
    #[expected_failure(abort_code = bogo::ESizeMissMatch)]
    fun failure_test_length_missmatch_4() {
        // tries to get an 8 digit name using a 3 digit one.
        // protects the user from mistakes.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let clock = scenario.take_shared<Clock>();
        let (
            mut domain1,
            domain2,
            domain3,
            mut day_one
        ) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();

        let new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain1,
            utf8(b"wowowowo.iota"),
            &clock,
            ctx(scenario)
        );
        burn_domain(new_name_1);

        // clean up all these domains.
        cleanup(domain1, domain2, domain3, day_one);

        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    #[test]
    fun test_acceptable_length_missmatch() {
        // We allow purchasing a domain of size 5+ if we pass a 5 length domain.
        // we only care about 3 & 4 digits.
        let mut scenario_val = test_init();
        let scenario = &mut scenario_val;
        scenario.next_tx(USER_ADDRESS);
        let clock = scenario.take_shared<Clock>();
        let (
            domain1,
            domain2,
            mut domain3,
            mut day_one
        ) = prepare(ctx(scenario), &clock);
        let mut iotans = scenario.take_shared<IotaNS>();
        let new_name_1 = bogo::claim(
            &mut day_one,
            &mut iotans,
            &mut domain3,
            utf8(b"wowwowowo.iota"),
            &clock,
            ctx(scenario)
        );
        burn_domain(new_name_1);

        // clean up all these domains.
        cleanup(domain1, domain2, domain3, day_one);

        test_scenario::return_shared(iotans);
        test_scenario::return_shared(clock);
        scenario_val.end();
    }

    // === Helpers ===

    // destroys all the created objects
    fun cleanup(
        domain1: IotansRegistration,
        domain2: IotansRegistration,
        domain3: IotansRegistration,
        day_one: DayOne
    ) {
        day_one::burn_for_testing(day_one);
        burn_domain(domain1);
        burn_domain(domain2);
        burn_domain(domain3);
    }

    // Helper function. Registers 3 domains and returns 2 day_ones to play with;
    fun prepare(ctx: &mut TxContext, clock: &Clock)
        : (
        IotansRegistration,
        IotansRegistration,
        IotansRegistration,
        DayOne
    ) {

        let domain1 = new_domain(utf8(b"tes.iota"), 1, clock, ctx);
        let domain2 = new_domain(utf8(b"test.iota"), 1, clock, ctx);
        let domain3 = new_domain(utf8(b"test1.iota"), 1, clock, ctx);

        let day_one = day_one::mint_for_testing(ctx);

        (domain1, domain2, domain3, day_one)

    }

    fun new_domain(
        domain_name: String,
        no_years: u8,
        clock: &Clock,
        ctx: &mut TxContext,
    ): IotansRegistration {
        nft::new_for_testing(
            domain::new(domain_name),
            no_years,
            clock,
            ctx,
        )
    }

    fun burn_domain(nft: IotansRegistration) {
        nft.burn_for_testing()
    }

}
