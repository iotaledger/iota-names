// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
module iota_names_subnames::unit_tests;

use iota_names::name::{Self, new as new_name, parent};
use std::string::utf8;
use iota_names_subnames::config::{assert_is_valid_subname, default};

// === Validity of subname | parent lengths (based on string) ===
#[test]
fun test_parent_relationships() {
    assert_is_valid_subname(
        &new_name(utf8(b"example.iota")),
        &new_name(utf8(b"sub.example.iota")),
        &default(),
    );
    assert_is_valid_subname(
        &new_name(utf8(b"sub.example.iota")),
        &new_name(utf8(b"sub.sub.example.iota")),
        &default(),
    );
    assert_is_valid_subname(
        &new_name(utf8(b"sub.sub.example.iota")),
        &new_name(utf8(b"sub.sub.sub.example.iota")),
        &default(),
    );
    assert_is_valid_subname(
        &new_name(
            utf8(
                b"sub.sub.sub.sub.sub.example.iota",
            ),
        ),
        &new_name(
            utf8(
                b"sub.sub.sub.sub.sub.sub.example.iota",
            ),
        ),
        &default(),
    );
}

#[test, expected_failure(abort_code = iota_names_subnames::config::EDepthExceedsLimit)]
fun test_too_large_subname_failure() {
    assert_is_valid_subname(
        &new_name(utf8(b"example.iota")),
        &new_name(
            utf8(
                b"sub.sub.sub.sub.sub.sub.sub.sub.sub.example.iota",
            ),
        ),
        &default(),
    );
}

#[test, expected_failure(abort_code = iota_names_subnames::config::EInvalidParent)]
fun test_invalid_parent_length_failure() {
    assert_is_valid_subname(
        &new_name(utf8(b"example.iota")),
        &new_name(utf8(b"sub.sub.example.iota")),
        &default(),
    );
}

#[test, expected_failure(abort_code = iota_names_subnames::config::EInvalidParent)]
fun test_invalid_parent_smaller_length_failure() {
    assert_is_valid_subname(
        &new_name(utf8(b"sub.sub.example.iota")),
        &new_name(utf8(b"sub.example.iota")),
        &default(),
    );
}

#[test, expected_failure(abort_code = iota_names_subnames::config::EInvalidParent)]
fun test_invalid_parent_failure() {
    assert_is_valid_subname(
        &new_name(utf8(b"test.example.iota")),
        &new_name(utf8(b"sub.sub.example.iota")),
        &default(),
    );
}

#[test, expected_failure(abort_code = iota_names_subnames::config::EInvalidParent)]
fun test_invalid_parent_tld_failure() {
    assert_is_valid_subname(
        &new_name(utf8(b"sub.example.move")),
        &new_name(utf8(b"sub.sub.example.iota")),
        &default(),
    );
}

#[test, expected_failure(abort_code = iota_names_subnames::config::EInvalidParent)]
fun test_invalid_parent_sld_failure() {
    assert_is_valid_subname(
        &new_name(utf8(b"sub.test.iota")),
        &new_name(utf8(b"sub.sub.example.iota")),
        &default(),
    );
}

#[test, expected_failure(abort_code = iota_names_subnames::config::EInvalidLabelSize)]
fun test_invalid_child_label_size_failure() {
    assert_is_valid_subname(
        &new_name(utf8(b"sub.test.iota")),
        &new_name(utf8(b"ob.example.iota")),
        &default(),
    );
}

#[test, expected_failure(abort_code = iota_names_subnames::config::ENotSupportedTLD)]
fun test_not_supported_tld_failure() {
    assert_is_valid_subname(
        &new_name(utf8(b"sub.sub.example.move")),
        &new_name(utf8(b"sub.example.move")),
        &default(),
    );
}

#[test]
fun derive_parent_from_child() {
    let parent = parent(
        &new_name(utf8(b"sub.example.iota")),
    ).extract();
    assert!(name::to_string(&parent) == utf8(b"example.iota"), 0);

    let parent = parent(
        &new_name(
            utf8(
                b"sub.sub.sub.sub.sub.sub.example.iota",
            ),
        ),
    ).extract();
    assert!(
        name::to_string(&parent) == utf8(
                b"sub.sub.sub.sub.sub.example.iota"
            ),
        0,
    );
}
