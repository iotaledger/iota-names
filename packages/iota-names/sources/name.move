// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Defines the `Name` type and helper functions.
///
/// Names are structured similar to web2 domains and the rules
/// determining what a valid name is can be found here:
/// https://en.wikipedia.org/wiki/Name_name#Name_name_syntax
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

// Construct a `Name` by parsing and validating the provided string
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
/// "name.iota" -> "iota"
public fun tln(self: &Name): &String {
    label(self, 0)
}

/// Returns the SLN (Second-Level Name) of a `Name`.
///
/// "name.iota" -> "iota"
public fun sln(self: &Name): &String {
    label(self, 1)
}

public fun number_of_levels(self: &Name): u64 {
    self.labels.length()
}

public fun is_subname(name: &Name): bool {
    number_of_levels(name) > 2
}

/// Derive the parent of a subname.
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

/// Checks if `parent` name is a valid parent for `child`.
public fun is_parent_of(parent: &Name, child: &Name): bool {
    if (number_of_levels(parent) < number_of_levels(child)) {
        let mut maybe_parent = parent(child);
        if (maybe_parent.is_some()) {
            let parent_name = maybe_parent.extract();
            parent_name.labels == &parent.labels
        } else {
            false
        }
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
            (0x61 <= character && character <= 0x7A)                   // a-z
                || (0x30 <= character && character <= 0x39)                // 0-9
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
