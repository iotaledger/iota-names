// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Skeleton } from '@iota/apps-ui-kit';

export function CardSkeletonLoader() {
    return (
        <div className="flex flex-wrap gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col w-[220px] rounded-xl h-[363px]">
                    <Skeleton className="w-full h-[220px] !rounded-xl" />
                    <div className="flex flex-col p-md gap-md name-card-shadow w-full flex-1">
                        <Skeleton className="!w-2/4 h-4 !rounded-lg" />
                        <Skeleton className="!w-1/4 h-3 !rounded-lg" />
                        <Skeleton className="!w-full h-9 !rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
