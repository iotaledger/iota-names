// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const QUERY_PARAM = 'simulateError';
const SESSION_PREFIX = 'sentry-simulated:';

function parseSimulationKeys(): string[] {
    if (typeof window === 'undefined') return [];
    const params = new URLSearchParams(window.location.search);
    const rawValues = params.getAll(QUERY_PARAM);
    return rawValues
        .flatMap((value) => value.split(','))
        .map((key) => key.trim().toLowerCase())
        .filter(Boolean);
}

function hasSimulatedKey(key: string): boolean {
    if (typeof window === 'undefined') return false;
    const normalizedKey = key.toLowerCase();
    const keys = parseSimulationKeys();
    if (keys.length === 0) return false;

    const shouldSimulate = keys.includes('all') || keys.includes(normalizedKey);
    if (!shouldSimulate) return false;

    try {
        const sessionKey = `${SESSION_PREFIX}${normalizedKey}`;
        if (window.sessionStorage.getItem(sessionKey)) {
            return false;
        }
        window.sessionStorage.setItem(sessionKey, '1');
    } catch {
        // Ignore sessionStorage failures (e.g. private mode)
    }

    return true;
}

export function simulateError(key: string, message?: string): void {
    if (!hasSimulatedKey(key)) return;

    const error = new Error(message ?? `Simulated error: ${key}`);
    error.name = 'SimulatedError';
    throw error;
}
