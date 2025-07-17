// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Tooltip, TooltipPosition } from '@iota/apps-ui-kit';

import { formatNameLabel } from '@/lib/utils/format/formatNames';

interface TruncatedNameWithTooltipProps {
    name: string;
    tooltipPosition?: TooltipPosition;
}

export function TruncatedNameWithTooltip({
    name,
    tooltipPosition = TooltipPosition.Bottom,
}: TruncatedNameWithTooltipProps) {
    const truncated = formatNameLabel(name, { truncateLongParts: true });
    const full = formatNameLabel(name, { truncateLongParts: false });

    const showTooltip = truncated !== full;

    const content = <span>{truncated}</span>;

    return showTooltip ? (
        <Tooltip text={full} position={tooltipPosition}>
            {content}
        </Tooltip>
    ) : (
        content
    );
}
