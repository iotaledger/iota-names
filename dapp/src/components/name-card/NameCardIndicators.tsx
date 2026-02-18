// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add, Subnames } from '@iota/apps-ui-icons';
import { ButtonUnstyled } from '@iota/apps-ui-kit';
import cx from 'clsx';

const INDICATOR_PRIMARY_TEXT_COLOR = 'text-names-neutral-70';
const INDICATOR_SECONDARY_TEXT_COLOR = 'text-iota-primary-80';
const INDICATOR_COMMON_CLASSES =
    'p-xxs rounded-lg leading-4 flex flex-row gap-x-xxxs  text-label-md w-max';

const CLICKABLE_INDICATOR_CLASSES = 'state-layer relative cursor-pointer';

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
    if (subnameCount === 0 && showAddSubnameLink) {
        return (
            <ButtonUnstyled
                className={cx(
                    INDICATOR_SECONDARY_TEXT_COLOR,
                    INDICATOR_COMMON_CLASSES,
                    CLICKABLE_INDICATOR_CLASSES,
                )}
                onClick={onAddSubnameClick}
            >
                <Add className="h-4 w-4" /> Add subname
            </ButtonUnstyled>
        );
    }

    return (
        <ButtonUnstyled
            onClick={onSubnameListClick}
            className={cx(
                INDICATOR_PRIMARY_TEXT_COLOR,
                INDICATOR_COMMON_CLASSES,
                CLICKABLE_INDICATOR_CLASSES,
            )}
        >
            <Subnames className="h-4 w-4" />
            {subnameCount} Subname{subnameCount !== 1 ? 's' : ''}
        </ButtonUnstyled>
    );
}
