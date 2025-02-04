/// A helper package for start-to-finish registration/renewal
module dev_util::util {
    use std::string::String;
    use iota::{
        coin::Coin,
        clock::Clock,
        iota::IOTA,
        tx_context::sender
    };

    use utils::direct_setup;
    use registration::register::register as ns_register;
    use iotans::{
        iotans::{IotaNS, get_config},
        config::Config,
        iotans_registration::IotansRegistration
    };

    const EPaymentTooSmall: u64 = 0;

    /// Authorization token for the controller.
    public struct DevUtil has drop {}

    public fun register(
        ns: &mut IotaNS,
        domain_name: String,
        no_years: u8,
        payment: &mut Coin<IOTA>,
        set_reverse_lookup: bool,
        clock: &Clock,
        ctx: &mut TxContext): IotansRegistration
    {
        let sender = sender(ctx);
        let config = ns.get_config<Config>();
        let price = config.calculate_price(domain_name.length() as u8, no_years);

        assert!(payment.value() >= price, EPaymentTooSmall);

        // Split off the needed payment
        let payment = payment.split(price, ctx);

        let registration = ns_register(ns, domain_name, no_years, payment, clock, ctx);

        direct_setup::set_target_address(ns, &registration, std::option::some(sender), clock);

        if (set_reverse_lookup) {
            direct_setup::set_reverse_lookup(ns, domain_name, ctx);
        };

        registration
    }
}
