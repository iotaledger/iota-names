// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add, Calendar } from '@iota/apps-ui-icons';
import { ButtonUnstyled } from '@iota/apps-ui-kit';
import cx from 'clsx';

import { AuctionDetails, formatTimeRemaining, getTimeRemaining } from '@/auctions';
import { useCountdown } from '@/auctions/hooks/useCountdown';

import { SvgSubnames } from '../svgs/SvgSubnames';

const INDICATOR_CLASSES =
    'state-layer relative cursor-pointer p-xxs rounded-lg leading-4 flex flex-row gap-x-xxxs text-names-neutral-70 text-label-md w-max';

interface ExpiryDateIndicatorProps {
    auction: AuctionDetails;
}

export function ExpiryDateIndicator({ auction }: ExpiryDateIndicatorProps) {
    const timeRemainingMs = getTimeRemaining(auction.metadata);
    const { milliseconds } = useCountdown(timeRemainingMs);

    const formattedTimeRemaining = formatTimeRemaining(milliseconds);

    return (
        <span className={cx(INDICATOR_CLASSES)}>
            <Calendar className="h-4 w-4" />
            {formattedTimeRemaining}
        </span>
    );
}

interface SubnameCountIndicatorProps {
    subnameCount: number;
    onSubnameListClick: () => void;
    onAddSubnameClick?: () => void;
    showAddSubnameLink?: boolean;
}

export function SubnameCountIndicator({
    subnameCount,
    onSubnameListClick,
    onAddSubnameClick,
    showAddSubnameLink,
}: SubnameCountIndicatorProps) {
    if (subnameCount === 0 && showAddSubnameLink !== false) {
        return (
            <ButtonUnstyled href="#" className={cx(INDICATOR_CLASSES)} onClick={onAddSubnameClick}>
                <Add className="h-4 w-4" /> Add subname
            </ButtonUnstyled>
        );
    }

    return (
        <ButtonUnstyled onClick={onSubnameListClick} className={cx(INDICATOR_CLASSES)}>
            <SvgSubnames className="h-4 w-4" />
            {subnameCount} Subname{subnameCount !== 1 ? 's' : ''}
        </ButtonUnstyled>
    );
}
