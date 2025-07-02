// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useUserAuctions } from '@/hooks';

export function UserAuctions() {
    const { data: auctions, isLoading, error } = useUserAuctions();

    if (isLoading) {
        return (
            <div className="rounded-lg border p-6 border-gray-700">
                <h3 className="mb-4 text-lg font-semibold">My Auctions</h3>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 rounded bg-gray-700"></div>
                    <div className="h-4 rounded bg-gray-700"></div>
                    <div className="h-4 rounded bg-gray-700"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border p-6 border-red-800">
                <h3 className="mb-4 text-lg font-semibold">My Auctions</h3>
                <p className="text-red-400">Failed to load auctions. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border p-6 border-gray-700">
            <h3 className="mb-4 text-lg font-semibold">My Auctions</h3>
            {!auctions || auctions.length === 0 ? (
                <p className=" text-gray-400">You haven't participated in any auctions yet.</p>
            ) : (
                <div className="space-y-2">
                    {auctions.map((domain) => (
                        <div
                            key={domain}
                            className="flex items-center justify-between rounded-md p-3 bg-gray-800"
                        >
                            <span className="font-medium">{domain}</span>
                            <span className="text-sm text-gray-400">Auction participant</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
