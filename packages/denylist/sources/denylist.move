// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module denylist::denylist {
    use std::string::String;

    use iota::table::{Self, Table};

    use iotans::iotans::{Self, AdminCap, IotaNS};

    /// No names in the passed list
    const ENoWordsInList: u64 = 1;

    /// A wrapper that holds the reserved and blocked names.
    public struct Denylist has store {
        // The list of reserved names.
        // Our public SLD registrations will be checking against it.
        reserved: Table<String, bool>,
        // The list of blocked names.
        // Subdomains + registrations will be checking against.
        blocked: Table<String, bool>,
    }

    /// The authorization for the denylist registry.
    public struct DenyListAuth has drop {}

    public fun setup(
        iotans: &mut IotaNS,
        cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        iotans::add_registry(
            cap,
            iotans,
            Denylist {
                reserved: table::new(ctx),
                blocked: table::new(ctx)
            }
        );
    }

    /// Check for a reserved name
    public fun is_reserved_name(iotans: &IotaNS, name: String): bool {
        denylist(iotans).reserved.contains(name)
    }

    /// Checks for a blocked name.
    public fun is_blocked_name(iotans: &IotaNS, name: String): bool {
        denylist(iotans).blocked.contains(name)
    }

    /// Add a list of reserved names to the list as admin.
    public fun add_reserved_names(
        iotans: &mut IotaNS,
        _: &AdminCap,
        words: vector<String>
    ) {
        internal_add_names_to_list(
            &mut denylist_mut(iotans).reserved,
            words
        );
    }

    /// Add a list of offensive names to the list as admin.
    public fun add_blocked_names(
        iotans: &mut IotaNS,
        _: &AdminCap,
        words: vector<String>
    ) {
        internal_add_names_to_list(
            &mut denylist_mut(iotans).blocked,
            words
        );
    }

    /// Remove a list of words from the reserved names list.
    public fun remove_reserved_names(
        iotans: &mut IotaNS,
        _: &AdminCap,
        words: vector<String>
    ) {
        internal_remove_names_from_list(
            &mut denylist_mut(iotans).reserved,
            words
        );
    }

    /// Remove a list of words from the list as admin.
    public fun remove_blocked_names(
        iotans: &mut IotaNS,
        _: &AdminCap,
        words: vector<String>
    ) {
        internal_remove_names_from_list(
            &mut denylist_mut(iotans).blocked,
            words
        );
    }

    /// Get immutable access to the registry.
    fun denylist(iotans: &IotaNS): &Denylist {
        iotans.registry()
    }

    /// Internal helper to get access to the BlockedNames object
    fun denylist_mut(iotans: &mut IotaNS): &mut Denylist {
        iotans::app_registry_mut<DenyListAuth, Denylist>(DenyListAuth {}, iotans)
    }

    /// Internal helper to batch add words to a table.
    fun internal_add_names_to_list(
        table: &mut Table<String, bool>,
        words: vector<String>
    ) {
        assert!(words.length() > 0, ENoWordsInList);

        let mut i = words.length();

        while (i > 0) {
            i = i - 1;
            let word = words[i];
            table.add(word, true);
        };
    }

    /// Internal helper to remove words from a table.
    fun internal_remove_names_from_list(
        table: &mut Table<String, bool>,
        words: vector<String>
    ) {
        assert!(words.length() > 0, ENoWordsInList);

        let mut i = words.length();

        while (i > 0) {
            i = i - 1;
            let word = words[i];
            table.remove(word);
        };
    }

    #[test_only]
    public fun new_for_testing(ctx: &mut TxContext): Denylist {
        Denylist {
            reserved: table::new(ctx),
            blocked: table::new(ctx)
        }
    }
}
