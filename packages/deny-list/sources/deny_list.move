// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module deny_list::deny_list {
    use std::string::String;

    use iota::table::{Self, Table};

    use iota_names::iota_names::{Self, AdminCap, IotaNames};

    #[error]
    const ENoWordsInList: vector<u8> = b"No names in the passed list.";

    /// A wrapper that holds the reserved and blocked names.
    public struct DenyList has store {
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
        iota_names: &mut IotaNames,
        cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        iota_names::add_registry(
            cap,
            iota_names,
            DenyList {
                reserved: table::new(ctx),
                blocked: table::new(ctx)
            }
        );
    }

    /// Check for a reserved name
    public fun is_reserved_name(iota_names: &IotaNames, name: String): bool {
        deny_list(iota_names).reserved.contains(name)
    }

    /// Checks for a blocked name.
    public fun is_blocked_name(iota_names: &IotaNames, name: String): bool {
        deny_list(iota_names).blocked.contains(name)
    }

    /// Add a list of reserved names to the list as admin.
    public fun add_reserved_names(
        iota_names: &mut IotaNames,
        _: &AdminCap,
        words: vector<String>
    ) {
        internal_add_names_to_list(
            &mut deny_list_mut(iota_names).reserved,
            words
        );
    }

    /// Add a list of offensive names to the list as admin.
    public fun add_blocked_names(
        iota_names: &mut IotaNames,
        _: &AdminCap,
        words: vector<String>
    ) {
        internal_add_names_to_list(
            &mut deny_list_mut(iota_names).blocked,
            words
        );
    }

    /// Remove a list of words from the reserved names list.
    public fun remove_reserved_names(
        iota_names: &mut IotaNames,
        _: &AdminCap,
        words: vector<String>
    ) {
        internal_remove_names_from_list(
            &mut deny_list_mut(iota_names).reserved,
            words
        );
    }

    /// Remove a list of words from the list as admin.
    public fun remove_blocked_names(
        iota_names: &mut IotaNames,
        _: &AdminCap,
        words: vector<String>
    ) {
        internal_remove_names_from_list(
            &mut deny_list_mut(iota_names).blocked,
            words
        );
    }

    /// Get immutable access to the registry.
    fun deny_list(iota_names: &IotaNames): &DenyList {
        iota_names.registry()
    }

    /// Internal helper to get access to the BlockedNames object
    fun deny_list_mut(iota_names: &mut IotaNames): &mut DenyList {
        iota_names::app_registry_mut<DenyListAuth, DenyList>(DenyListAuth {}, iota_names)
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
    public fun new_for_testing(ctx: &mut TxContext): DenyList {
        DenyList {
            reserved: table::new(ctx),
            blocked: table::new(ctx)
        }
    }
}