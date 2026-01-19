// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Copy } from '@iota/apps-ui-icons';
import { Tooltip, TooltipPosition } from '@iota/apps-ui-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';

import { copyToClipboard } from '@/lib/utils/copyToClipboard';

interface TruncatedNameWithTooltipProps {
    name: string;
    tooltipPosition?: TooltipPosition;
}

export function TruncatedNameWithTooltip({
    name,
    tooltipPosition = TooltipPosition.Bottom,
}: TruncatedNameWithTooltipProps) {
    const truncated = normalizeIotaName(name, 'at', { truncateLongParts: true });
    const full = normalizeIotaName(name, 'at', { truncateLongParts: false });
    const showTooltip = truncated !== full;

    function handleCopy() {
        copyToClipboard(name);
    }

    const content = (
        <div
            onClick={handleCopy}
            className="group inline-flex items-center gap-x-xs cursor-pointer"
        >
            <span className="truncate">{truncated}</span>

            <Copy className="w-4 h-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-names-neutral-92" />
        </div>
    );

    return showTooltip ? (
        <div className="w-full [&>div]:break-words [&>div]:w-full">
            <Tooltip text={full} position={tooltipPosition}>
                {content}
            </Tooltip>
        </div>
    ) : (
        content
    );
}
