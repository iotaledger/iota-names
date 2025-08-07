// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Defines the `Name` type and helper functions.
///
/// Names are structured similar to web2 domains, and the rules
/// determining what constitutes a valid name can be found here:
/// https://en.wikipedia.org/wiki/Domain_name#Domain_name_syntax
module iota_names::name;

use std::string::{Self, String, utf8};

#[error]
const EInvalidName: vector<u8> = b"Invalid name.";

/// The maximum length of a full name.
const MAX_NAME_LENGTH: u64 = 235;
/// The minimum length of an individual label in a name.
const MIN_LABEL_LENGTH: u64 = 1;
/// The maximum length of an individual label in a name.
const MAX_LABEL_LENGTH: u64 = 63;

/// Representation of a valid IotaNames `Name`.
public struct Name has copy, drop, store {
    /// Vector of labels that make up a name.
    ///
    /// Labels are stored in reverse order such that the TLN is always in
    /// position `0`.
    /// e.g. name "pay.name.iota" will be stored in the vector as ["iota",
    /// "name", "pay"].
    labels: vector<String>,
}

// Constructs a `Name` by parsing and validating the provided string.
public fun new(name: String): Name {
    assert!(name.length() <= MAX_NAME_LENGTH, EInvalidName);

    let mut labels = split_by_dot(name);
    validate_labels(&labels);
    labels.reverse();
    Name {
        labels,
    }
}

/// Converts a name into a fully-qualified string representation.
public fun to_string(self: &Name): String {
    let dot = utf8(b".");
    let len = self.labels.length();
    let mut i = 0;
    let mut out = string::utf8(vector::empty());

    while (i < len) {
        let part = &self.labels[(len - i) - 1];
        out.append(*part);

        i = i + 1;
        if (i != len) {
            out.append(dot);
        }
    };

    out
}

/// Returns the `label` in a name specified by `level`.
///
/// Given the name "pay.name.iota" the individual labels have the following
/// levels:
/// - "pay" - `2`
/// - "name" - `1`
/// - "iota" - `0`
///
/// This means that the TLN will always be at level `0`.
public fun label(self: &Name, level: u64): &String {
    &self.labels[level]
}

/// Returns the TLN (Top-Level Name) of a `Name`.
///
/// e.g. `name.iota` -> `iota`
public fun tln(self: &Name): &String {
    label(self, 0)
}

/// Returns the SLN (Second-Level Name) of a `Name`.
///
/// e.g. `name.iota` -> `name`
public fun sln(self: &Name): &String {
    label(self, 1)
}

/// Returns the number of labels of a `Name` (TLN included).
/// 
/// e.g. `name.iota` -> 2
public fun number_of_levels(self: &Name): u64 {
    self.labels.length()
}

/// Returns whether the name is a subname.
/// 
/// e.g.
/// `name.iota` -> `false`, 
/// `subname.name.iota` -> `true`
public fun is_subname(name: &Name): bool {
    number_of_levels(name) > 2
}

/// Derives the parent of a subname.
/// 
/// e.g. `subname.example.iota` -> `example.iota`
public fun parent(name: &Name): Option<Name> {
    if (is_subname(name)) {
        let mut labels = name.labels;
        // we pop the last element and construct the parent from the remaining
        // labels.
        labels.pop_back();
        option::some(Name {
            labels,
        })
    } else {
        option::none()
    }
}

/// Checks if the given `parent` name is valid for the given `child` name.
/// 
/// e.g. (`example.iota`, `subname.example.iota`) -> `true`
public fun is_parent_of(parent: &Name, child: &Name): bool {
    if (number_of_levels(parent) < number_of_levels(child)) {
        // This is safe to extract, because `parent` is guaranteed to be a valid name with 2 labels,
        // so `child` will always have at least 3 labels here and thus always has a parent.
        let parent_name = parent(child).extract();
        parent_name.labels == &parent.labels
    } else {
        false
    }
}

fun validate_labels(labels: &vector<String>) {
    assert!(!labels.is_empty(), EInvalidName);

    let len = labels.length();
    let mut index = 0;

    while (index < len) {
        let label = &labels[index];
        assert!(is_valid_label(label), EInvalidName);
        index = index + 1;
    }
}

fun is_valid_label(label: &String): bool {
    let len = label.length();
    let label_bytes = label.as_bytes();
    let mut index = 0;

    if (!(len >= MIN_LABEL_LENGTH && len <= MAX_LABEL_LENGTH)) {
        return false
    };

    while (index < len) {
        let character = label_bytes[index];
        let is_valid_character =
            (0x61 <= character && character <= 0x7A)                      // a-z
                || (0x30 <= character && character <= 0x39)               // 0-9
                || (character == 0x2D && index != 0 && index != len - 1); // '-' not at beginning or end

        if (!is_valid_character) {
            return false
        };

        index = index + 1;
    };

    true
}

/// Splits a string `s` by the character `.` into a vector of subslices,
/// excluding the `.`
fun split_by_dot(mut s: String): vector<String> {
    let dot = utf8(b".");
    let mut parts: vector<String> = vector[];
    while (!s.is_empty()) {
        let index_of_next_dot = s.index_of(&dot);
        let part = s.substring(0, index_of_next_dot);
        parts.push_back(part);

        let len = s.length();
        let start_of_next_part = if (index_of_next_dot == len) {
            len
        } else {
            index_of_next_dot + 1
        };

        s = s.substring(start_of_next_part, len);
    };

    parts
}

// === Tests ===

#[test_only]
use iota::test_utils::assert_eq;

#[test_only]
fun test_valid_name(name: vector<u8>, expected_labels: vector<vector<u8>>) {
    let name_str = utf8(name);
    let name = new(name_str);
    let expected_labels = prep_expected_labels(expected_labels);
    assert_eq(name.labels, expected_labels);
    assert_eq(name_str, to_string(&name));

    // Validate `name::label` function
    let len = vector::length(&expected_labels);
    let mut index = 0;

    while (index < len) {
        let label = &expected_labels[index];
        assert_eq(*label, *label(&name, index));
        index = index + 1;
    }
}

#[test_only]
fun prep_expected_labels(mut labels: vector<vector<u8>>): vector<String> {
    let mut out = vector[];
    while (!labels.is_empty()) {
        let label = labels.pop_back();
        out.push_back(utf8(label));
    };
    out
}

#[test]
fun valid_names() {
    test_valid_name(b"abc.123", vector[b"abc", b"123"]);
    test_valid_name(b"iotanames.iota", vector[b"iotanames", b"iota"]);
    test_valid_name(
        b"1.2.3.4.5.6.7.8.9.0.iota",
        vector[b"1", b"2", b"3", b"4", b"5", b"6", b"7", b"8", b"9", b"0", b"iota"],
    );
    test_valid_name(b"pay.foundation.iota", vector[b"pay", b"foundation", b"iota"]);
    test_valid_name(
        b"abcdefghijklmnopqrstuvxyz0123456789.move",
        vector[b"abcdefghijklmnopqrstuvxyz0123456789", b"move"],
    );
    test_valid_name(b"a----b.iota", vector[b"a----b", b"iota"]);
}

#[test_only]
fun expect_valid_label(label: vector<u8>, is_valid: bool) {
    let label = utf8(label);
    assert_eq(is_valid_label(&label), is_valid);
}

#[test]
fun test_valid_labels() {
    expect_valid_label(b"", false);
    expect_valid_label(b"-", false);
    expect_valid_label(b"-aaa", false);
    expect_valid_label(b"aaa-", false);
    expect_valid_label(b"a-a", true);
    expect_valid_label(b"abcdefghijklmnopqrstuvxyz-0123456789", true);
}

#[test_only]
fun expect_is_subname(name: vector<u8>, subname: vector<u8>, expected: bool) {
    let name = new(utf8(name));
    let subname = new(utf8(subname));
    assert_eq(is_parent_of(&name, &subname), expected);
}

#[test]
fun test_is_subname() {
    expect_is_subname(b"foundation.iota", b"pay.foundation.iota", true);
    expect_is_subname(b"pay.foundation.iota", b"foundation.iota", false);
    expect_is_subname(b"foundation.iota", b"pay.move.iota", false);
}

#[test]
fun split_simple() {
    let s = utf8(b"a.b");
    let expected = vector[utf8(b"a"), utf8(b"b")];
    let actual = split_by_dot(s);
    assert_eq(actual, expected);
}

#[test]
fun split_simple_2() {
    let s = utf8(b"pay.narwhal.iota");
    let expected = vector[utf8(b"pay"), utf8(b"narwhal"), utf8(b"iota")];
    let actual = split_by_dot(s);
    assert_eq(actual, expected);
}

#[test]
fun split_string_with_no_dots() {
    let s = utf8(b"abc");
    let expected = vector[utf8(b"abc")];
    let actual = split_by_dot(s);
    assert_eq(actual, expected);
}

#[test]
fun split_string_surrounded_by_dots() {
    let s = utf8(b".a.");
    let expected = vector[utf8(vector::empty()), utf8(b"a")];
    let actual = split_by_dot(s);
    assert_eq(actual, expected);
}

#[test]
fun split_empty_string() {
    let s = utf8(vector::empty());
    let expected = vector[];
    let actual = split_by_dot(s);
    assert_eq(actual, expected);
}

#[test]
fun split_one_dot() {
    let s = utf8(b".");
    let expected = vector[utf8(vector::empty())];
    let actual = split_by_dot(s);
    assert_eq(actual, expected);
}

#[test]
fun split_two_dots() {
    let s = utf8(b"..");
    let expected = vector[utf8(vector::empty()), utf8(vector::empty())];
    let actual = split_by_dot(s);
    assert_eq(actual, expected);
}

#[test]
fun split_three_dots() {
    let s = utf8(b"...");
    let expected = vector[utf8(vector::empty()), utf8(vector::empty()), utf8(vector::empty())];
    let actual = split_by_dot(s);
    assert_eq(actual, expected);
}

#[test]
#[allow(lint(abort_without_constant))]
fun derive_parent() {
    let parent = new(utf8(b"parent.iota"));
    let child = new(utf8(b"child.parent.iota"));

    assert!(parent(&child).extract() == parent, 0);
}

#[test]
fun test_parent_edge_cases() {
    // Test with a 2-level name - should return none
    let two_level_name = new(utf8(b"test.iota"));
    assert!(parent(&two_level_name).is_none());
    
    // Test with a 3-level name (subname) - should return parent
    let three_level_name = new(utf8(b"sub.test.iota"));
    let mut parent_result = parent(&three_level_name);
    assert!(parent_result.is_some());
    let parent_name = parent_result.extract();
    assert_eq(parent_name.to_string(), utf8(b"test.iota"));
    
    // Test with a 4-level name (deep subname)
    let four_level_name = new(utf8(b"deep.sub.test.iota"));
    let mut parent_result = parent(&four_level_name);
    assert!(parent_result.is_some());
    let parent_name = parent_result.extract();
    assert_eq(parent_name.to_string(), utf8(b"sub.test.iota"));
}

#[test]
fun test_is_parent_of_edge_cases() {
    let parent = new(utf8(b"parent.iota"));
    let child = new(utf8(b"child.parent.iota"));
    let not_child = new(utf8(b"other.test.iota"));
    let same_level = new(utf8(b"sibling.iota"));
    
    // Test valid parent-child relationship
    assert!(is_parent_of(&parent, &child));
    
    // Test invalid relationships
    assert!(!is_parent_of(&parent, &not_child)); // Different parent
    assert!(!is_parent_of(&parent, &same_level)); // Same level
    assert!(!is_parent_of(&child, &parent)); // Reverse relationship
    
    // Test with deep hierarchy
    let grandparent = new(utf8(b"grandparent.iota"));
    let deep_child = new(utf8(b"deep.child.parent.iota"));
    assert!(!is_parent_of(&grandparent, &deep_child)); // Not direct parent
    assert!(is_parent_of(&child, &deep_child)); // Direct parent
}

#[test, expected_failure(abort_code = ::iota_names::name::EInvalidName)]
fun test_validate_labels_empty_vector() {
    // Test with empty label vector - should fail
    new(utf8(b""));
}

#[test, expected_failure(abort_code = ::iota_names::name::EInvalidName)]
fun test_validate_labels_invalid_characters() {
    new(utf8(b"test@.iota"));
}

#[test, expected_failure(abort_code = ::iota_names::name::EInvalidName)]
fun test_validate_labels_hyphen_at_start() {
    new(utf8(b"-test.iota"));
}

#[test, expected_failure(abort_code = ::iota_names::name::EInvalidName)]
fun test_validate_labels_hyphen_at_end() {
    new(utf8(b"test-.iota"));
}

#[test, expected_failure(abort_code = ::iota_names::name::EInvalidName)]
fun test_validate_labels_too_long() {
    let long_label = b"64chars64chars64chars64chars64chars64chars64chars64chars64chars6";
    let mut long_name = vector::empty<u8>();
    vector::append(&mut long_name, long_label);
    vector::append(&mut long_name, b".iota");
    new(utf8(long_name));
}

#[test, expected_failure(abort_code = ::iota_names::name::EInvalidName)]
fun test_validate_labels_too_short() {
    new(utf8(b".iota"));
}

#[test, expected_failure(abort_code = ::iota_names::name::EInvalidName)]
fun test_validate_name_too_long() {
    new(utf8(b"236chars-is-one-too-much-236chars-is-one-too-much.236chars-is-one-too-much-236chars-is-one-too-much.236chars-is-one-too-much-236chars-is-one-too-much.236chars-is-one-too-much-236chars-is-one-too-much.236chars-is-one-too-much-236cha.iota"));
}

#[test]
fun test_new_edge_cases() {
    // Test with minimum valid length
    let min_name = new(utf8(b"1.iota"));
    assert_eq(*min_name.label(1), utf8(b"1"));
    
    // Test with maximum valid length
    let max_label = b"63chars63chars63chars63chars63chars63chars63chars63chars63chars";
    let mut max_name_bytes = vector::empty<u8>();
    vector::append(&mut max_name_bytes, max_label);
    vector::append(&mut max_name_bytes, b".iota");
    let max_name = new(utf8(max_name_bytes));
    assert_eq(*max_name.label(1), utf8(max_label));
    
    // Test with valid hyphen in middle
    let hyphen_name = new(utf8(b"test-name.iota"));
    assert_eq(*hyphen_name.label(1), utf8(b"test-name"));
}
