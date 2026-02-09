// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/**
 * Context Snapshot Cache
 *
 * Solves the timing issue where analytics events are processed after UI changes.
 * By caching UI context during event capture phase, we preserve state (e.g., dialog title)
 * before handlers modify/remove DOM elements. Cached snapshots expire after 1s.
 */

/**
 * Snapshot of UI context at a specific point in time.
 * Extend this interface to capture additional context properties.
 */
export interface ContextSnapshot {
    dialogTitle: string | null;
    timestamp: number;
}

/**
 * Configuration options for the context snapshot cache.
 */
export interface ContextSnapshotCacheConfig {
    /** TTL for cached snapshots in milliseconds. @default 1000 */
    ttlMs?: number;
}

/**
 * Cache for storing UI context snapshots with automatic expiration.
 * Stores only the most recent snapshot and auto-expires based on TTL.
 */
export class ContextSnapshotCache {
    private snapshot: ContextSnapshot | null = null;
    private readonly ttlMs: number;

    constructor(config: ContextSnapshotCacheConfig = {}) {
        this.ttlMs = config.ttlMs ?? 1000;
    }

    /** Store a new snapshot, overwriting any existing one. */
    set(snapshot: ContextSnapshot): void {
        this.snapshot = snapshot;
    }

    /** Get cached snapshot if it exists and hasn't expired. */
    get(): ContextSnapshot | null {
        if (!this.snapshot) {
            return null;
        }

        const age = Date.now() - this.snapshot.timestamp;
        if (age > this.ttlMs) {
            this.snapshot = null;
            return null;
        }

        return this.snapshot;
    }

    /** Clear the cached snapshot. */
    clear(): void {
        this.snapshot = null;
    }

    /** Check if a valid (non-expired) snapshot exists. */
    has(): boolean {
        return this.get() !== null;
    }
}

/** Global cache instance shared across the plugin lifecycle. */
export const contextSnapshotCache = new ContextSnapshotCache();
