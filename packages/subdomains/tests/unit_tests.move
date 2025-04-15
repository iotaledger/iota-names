// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
module subdomains::unit_tests{
    use std::string::{ utf8 };
    use iota_names::domain::{Self, new as new_domain, parent};
    use subdomains::config::{
        assert_is_valid_subdomain,
        default
    };

    // === Validity of subdomain | parent lengths (based on string) ===
    #[test]
    fun test_parent_relationships() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"example.iota")),
            &new_domain(utf8(b"sub.example.iota")),
            &default()
        );
        assert_is_valid_subdomain(
            &new_domain(utf8(b"sub.example.iota")),
            &new_domain(utf8(b"sub.sub.example.iota")),
            &default()
        );
        assert_is_valid_subdomain(
            &new_domain(utf8(b"sub.sub.example.iota")),
            &new_domain(utf8(b"sub.sub.sub.example.iota")),
            &default()
        );
        assert_is_valid_subdomain(
            &new_domain(
                utf8(
                    b"sub.sub.sub.sub.sub.example.iota"
                )
            ),
            &new_domain(
                utf8(
                    b"sub.sub.sub.sub.sub.sub.example.iota"
                )
            ),
            &default()
        );
    }

    #[test, expected_failure(abort_code = subdomains::config::EDepthExceedsLimit)]
    fun test_too_large_subdomain_failure() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"example.iota")),
            &new_domain(
                utf8(
                    b"sub.sub.sub.sub.sub.sub.sub.sub.sub.example.iota"
                )
            ),
            &default()
        );
    }

    #[test, expected_failure(abort_code = subdomains::config::EInvalidParent)]
    fun test_invalid_parent_length_failure() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"example.iota")),
            &new_domain(utf8(b"sub.sub.example.iota")),
            &default()
        );
    }

    #[test, expected_failure(abort_code = subdomains::config::EInvalidParent)]
    fun test_invalid_parent_smaller_length_failure() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"sub.sub.example.iota")),
            &new_domain(utf8(b"sub.example.iota")),
            &default()
        );
    }

    #[test, expected_failure(abort_code = subdomains::config::EInvalidParent)]
    fun test_invalid_parent_failure() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"test.example.iota")),
            &new_domain(utf8(b"sub.sub.example.iota")),
            &default()
        );
    }

    #[test, expected_failure(abort_code = subdomains::config::EInvalidParent)]
    fun test_invalid_parent_tld_failure() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"sub.example.move")),
            &new_domain(utf8(b"sub.sub.example.iota")),
            &default()
        );
    }

    #[test, expected_failure(abort_code = subdomains::config::EInvalidParent)]
    fun test_invalid_parent_sld_failure() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"sub.test.iota")),
            &new_domain(utf8(b"sub.sub.example.iota")),
            &default()
        );
    }

    #[test, expected_failure(abort_code = subdomains::config::EInvalidLabelSize)]
    fun test_invalid_child_label_size_failure() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"sub.test.iota")),
            &new_domain(utf8(b"ob.example.iota")),
            &default()
        );
    }

    #[test, expected_failure(abort_code = subdomains::config::ENotSupportedTLD)]
    fun test_not_supported_tld_failure() {
        assert_is_valid_subdomain(
            &new_domain(utf8(b"sub.sub.example.move")),
            &new_domain(utf8(b"sub.example.move")),
            &default()
        );
    }

    #[test]
    fun derive_parent_from_child() {
        let parent = parent(
            &new_domain(utf8(b"sub.example.iota"))
        ).extract();
        assert!(
            domain::to_string(&parent) == utf8(b"example.iota"),
            0
        );

        let parent = parent(
            &new_domain(
                utf8(
                    b"sub.sub.sub.sub.sub.sub.example.iota"
                )
            )
        ).extract();
        assert!(
            domain::to_string(&parent) == utf8(
                b"sub.sub.sub.sub.sub.example.iota"
            ),
            0
        );

    }
}
