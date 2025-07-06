// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from 'vitest';

import { isValidIotaName, normalizeIotaName } from '../src/utils';

describe('Name validation', () => {
    test('should be valid dot-style', () => {
        expect(isValidIotaName('test.iota')).toBe(true);
        expect(isValidIotaName('sub.test.iota')).toBe(true);
        expect(isValidIotaName('more.sub.test.iota')).toBe(true);

        expect(isValidIotaName('test-dash.iota')).toBe(true);
        expect(isValidIotaName('sub-dash.test-dash.iota')).toBe(true);

        expect(isValidIotaName('test101.iota')).toBe(true);
        expect(isValidIotaName('sub-101.9test.iota')).toBe(true);

        expect(isValidIotaName('911.iota')).toBe(true);
    });

    test('should be valid at-style', () => {
        expect(isValidIotaName('sub@test')).toBe(true);
        expect(isValidIotaName('more.sub@test')).toBe(true);
        expect(isValidIotaName('even.more.sub@test')).toBe(true);

        expect(isValidIotaName('test-dash@test')).toBe(true);
        expect(isValidIotaName('sub-dash.test-dash@test')).toBe(true);

        expect(isValidIotaName('test101@test')).toBe(true);
        expect(isValidIotaName('sub-101.9test@test')).toBe(true);

        expect(isValidIotaName('911@test')).toBe(true);
    });

    test('should not start or end with dashes', () => {
        expect(isValidIotaName('-test.iota')).toBe(false);
        expect(isValidIotaName('test-.iota')).toBe(false);
        expect(isValidIotaName('sub-.test@test')).toBe(false);
        expect(isValidIotaName('-sub-test.test@test')).toBe(false);
    });

    test('should not contain invalid characters', () => {
        expect(isValidIotaName('@test.iota')).toBe(false);
        expect(isValidIotaName('test#@test')).toBe(false);
        expect(isValidIotaName('sub^.test.iota')).toBe(false);
        expect(isValidIotaName('one&two.test@test')).toBe(false);
        expect(isValidIotaName('one*two.test.iota')).toBe(false);
        expect(isValidIotaName('(psst).iota')).toBe(false);
    });

    test('should contain at least two labels dot-style', () => {
        expect(isValidIotaName('iota')).toBe(false);
        expect(isValidIotaName('test')).toBe(false);
    });

    test('should be valid with only name at-style', () => {
        expect(isValidIotaName('@test')).toBe(true);
    });

    test('should be invalid', () => {
        expect(isValidIotaName('Name.iota')).toBe(false);
    });
});

describe('Name normalization', () => {
    test('should normalize as the same value dot-style', () => {
        expect(normalizeIotaName('test.iota', 'dot')).toEqual('test.iota');
        expect(normalizeIotaName('sub.test.iota', 'dot')).toEqual('sub.test.iota');
        expect(normalizeIotaName('more.sub.test.iota', 'dot')).toEqual('more.sub.test.iota');
    });

    test('should normalize as the same value at-style', () => {
        expect(normalizeIotaName('test@test')).toEqual('test@test');
        expect(normalizeIotaName('sub.test@test')).toEqual('sub.test@test');
        expect(normalizeIotaName('more.sub.test@test')).toEqual('more.sub.test@test');
    });

    test('should normalize as dot-style', () => {
        expect(normalizeIotaName('@test', 'dot')).toEqual('test.iota');
        expect(normalizeIotaName('test.iota', 'dot')).toEqual('test.iota');
        expect(normalizeIotaName('sub.test@test', 'dot')).toEqual('sub.test.test.iota');
        expect(normalizeIotaName('more.sub.test@test', 'dot')).toEqual('more.sub.test.test.iota');
    });

    test('should normalize as at-style', () => {
        expect(normalizeIotaName('@test', 'dot')).toEqual('test.iota');
        expect(normalizeIotaName('test@test', 'at')).toEqual('test@test');
        expect(normalizeIotaName('sub.test.iota', 'at')).toEqual('sub@test');
        expect(normalizeIotaName('more.sub.test.iota', 'at')).toEqual('more.sub@test');
    });

    test('should normalize as lowercase', () => {
        expect(normalizeIotaName('NaMe.ioTa', 'dot')).toEqual('name.iota');
        expect(normalizeIotaName('NaMe.ioTa')).toEqual('@name');
    });

    test('should be invalid', () => {
        expect(() => normalizeIotaName('-test.iota')).toThrow('Invalid IOTA name "-test.iota"');
        expect(() => normalizeIotaName('test-.iota')).toThrow('Invalid IOTA name "test-.iota"');
        expect(() => normalizeIotaName('sub-.test@test')).toThrow(
            'Invalid IOTA name "sub-.test@test"',
        );
        expect(() => normalizeIotaName('-sub-test.test@test')).toThrow(
            'Invalid IOTA name "-sub-test.test@test"',
        );
        expect(() => normalizeIotaName('awudi')).toThrow('Invalid IOTA name "awudi"');
        expect(() => normalizeIotaName('.iota')).toThrow('Invalid IOTA name ".iota"');
        expect(() => normalizeIotaName('space .iota')).toThrow('Invalid IOTA name "space .iota"');
        expect(() => normalizeIotaName('empty. .iota')).toThrow('Invalid IOTA name "empty. .iota"');
    });
});
