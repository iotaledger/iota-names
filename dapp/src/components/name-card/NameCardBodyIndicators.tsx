// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add, Calendar } from '@iota/apps-ui-icons';
import { ButtonUnstyled } from '@iota/apps-ui-kit';
import cx from 'clsx';
import Link from 'next/link';

import { SvgSubnames } from '../svgs/SvgSubnames';
import { INDICATOR_CLASSES } from './helpers';

interface ExpiryDateIndicatorProps {
    expiration: number;
}

export function ExpiryDateIndicator({ expiration }: ExpiryDateIndicatorProps) {
    const expDate = new Date(expiration).getDate();

    return (
        <span className={cx(INDICATOR_CLASSES)}>
            <Calendar className="h-4 w-4" />
            {expDate}
        </span>
    );
}

interface SubnameCountIndicatorProps {
    subnameCount: number;
    onSubnameListClick: () => void;
    showAddSubnameLink?: boolean;
}

export function SubnameCountIndicator({
    subnameCount,
    onSubnameListClick,
    showAddSubnameLink,
}: SubnameCountIndicatorProps) {
    if (subnameCount === 0 && showAddSubnameLink !== false) {
        return (
            <Link href="#" className={cx(INDICATOR_CLASSES)}>
                <Add className="h-4 w-4" /> Add subname
            </Link>
        );
    }

    return (
        <ButtonUnstyled onClick={onSubnameListClick} className={cx(INDICATOR_CLASSES)}>
            <SvgSubnames className="h-4 w-4" />
            {subnameCount} Subname{subnameCount !== 1 ? 's' : ''}
        </ButtonUnstyled>
    );
}
