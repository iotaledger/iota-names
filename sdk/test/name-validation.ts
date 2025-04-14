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
		expect(isValidIotaName('test@iota')).toBe(true);
		expect(isValidIotaName('sub.test@iota')).toBe(true);
		expect(isValidIotaName('more.sub.test@iota')).toBe(true);

		expect(isValidIotaName('test-dash@iota')).toBe(true);
		expect(isValidIotaName('sub-dash.test-dash@iota')).toBe(true);

		expect(isValidIotaName('test101@iota')).toBe(true);
		expect(isValidIotaName('sub-101.9test@iota')).toBe(true);

		expect(isValidIotaName('911@iota')).toBe(true);
	});

	test('should not start or end with dashes', () => {
		expect(isValidIotaName('-test.iota')).toBe(false);
		expect(isValidIotaName('test-.iota')).toBe(false);
		expect(isValidIotaName('sub-.test@iota')).toBe(false);
		expect(isValidIotaName('-sub-test.test@iota')).toBe(false);
	});

	test('should not contain invalid characters', () => {
		expect(isValidIotaName('@test.iota')).toBe(false);
		expect(isValidIotaName('test#@iota')).toBe(false);
		expect(isValidIotaName('sub^.test.iota')).toBe(false);
		expect(isValidIotaName('one&two.test@iota')).toBe(false);
		expect(isValidIotaName('one*two.test.iota')).toBe(false);
		expect(isValidIotaName('(psst).iota')).toBe(false);
	});

	test('should contain at least two labels', () => {
		expect(isValidIotaName('iota')).toBe(false);
		expect(isValidIotaName('test')).toBe(false);
	});
});

describe('Name normalization', () => {
	test('should normalize as the same value dot-style', () => {
		expect(normalizeIotaName('test.iota')).toEqual('test.iota');
		expect(normalizeIotaName('sub.test.iota')).toEqual('sub.test.iota');
		expect(normalizeIotaName('more.sub.test.iota')).toEqual('more.sub.test.iota');
	});

	test('should normalize as the same value at-style', () => {
		expect(normalizeIotaName('test@iota')).toEqual('test@iota');
		expect(normalizeIotaName('sub.test@iota')).toEqual('sub.test@iota');
		expect(normalizeIotaName('more.sub.test@iota')).toEqual('more.sub.test@iota');
	});

	test('should normalize as dot-style', () => {
		expect(normalizeIotaName('test.iota', 'dot')).toEqual('test.iota');
		expect(normalizeIotaName('sub.test@iota', 'dot')).toEqual('sub.test.iota');
		expect(normalizeIotaName('more.sub.test@iota', 'dot')).toEqual('more.sub.test.iota');
	});

	test('should normalize as at-style', () => {
		expect(normalizeIotaName('test@iota', 'at')).toEqual('test@iota');
		expect(normalizeIotaName('sub.test.iota', 'at')).toEqual('sub.test@iota');
		expect(normalizeIotaName('more.sub.test.iota', 'at')).toEqual('more.sub.test@iota');
	});

	test('should be invalid', () => {
		expect(normalizeIotaName('-test.iota')).toThrow('Invalid IOTA name "-test.iota"');
		expect(normalizeIotaName('test-.iota')).toThrow('Invalid IOTA name "test-.iota"');
		expect(normalizeIotaName('sub-.test@iota')).toThrow('Invalid IOTA name "sub-.test@iota"');
		expect(normalizeIotaName('-sub-test.test@iota')).toThrow(
			'Invalid IOTA name "-sub-test.test@iota"',
		);
		expect(normalizeIotaName('awudi')).toThrow('Invalid IOTA name "awudi"');
	});
});
