// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Defines metadata related functions for the IOTA name service.
module metadata::metadata {
    use iotans::{iotans::IotaNS, registry::Registry, iotans_registration::IotansRegistration};
    use std::string::String;
    use metadata::keys::{image_url, website};
    use iota::clock::Clock;

    /// Authorization token for the controller.
    public struct Metadata has drop {}

    public fun get_image_url(ns: &IotaNS, nft: &IotansRegistration): Option<String> {
        get_value(ns, nft, &image_url())
    }

    public fun get_website(ns: &IotaNS, nft: &IotansRegistration): Option<String> {
        get_value(ns, nft, &website())
    }

    public fun set_image_url(ns: &mut IotaNS, nft: &IotansRegistration, clock: &Clock, value: String) {
        set_value(ns, nft, clock, image_url(), value);
    }

    public fun set_website(ns: &mut IotaNS, nft: &IotansRegistration, clock: &Clock, value: String) {
        set_value(ns, nft, clock, website(), value);
    }

    public fun get_value(ns: &IotaNS, nft: &IotansRegistration, key: &String): Option<String> {
        let registry = ns.registry<Registry>();

        let domain = nft.domain();
        registry.get_data(domain).try_get(key)
    }

    public fun set_value(ns: &mut IotaNS, nft: &IotansRegistration, clock: &Clock, key: String, value: String) {
        let registry = registry_mut(ns, nft, clock);

        let domain = nft.domain();
        let mut data = *registry.get_data(domain);
        data.insert(key, value);
        registry.set_data(domain, data);
    }

    fun registry_mut(ns: &mut IotaNS, nft: &IotansRegistration, clock: &Clock): &mut Registry {
        let registry = iotans::iotans::app_registry_mut<Metadata, Registry>(Metadata {}, ns);
        registry.assert_nft_is_authorized(nft, clock);
        registry
    }
}
