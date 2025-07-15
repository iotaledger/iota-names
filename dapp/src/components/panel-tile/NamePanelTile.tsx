// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Info, StarHex, Warning } from '@iota/apps-ui-icons';
import { ButtonUnstyled } from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import clsx from 'clsx';

import { useRegistrationNfts } from '@/hooks';
import { useGetDefaultName } from '@/hooks/useGetDefaultName';
import { RegistrationNft } from '@/lib/interfaces';
import { formatExpirationDate } from '@/lib/utils/format/formatExpirationDate';
import { getNameLabel, splitNameParts } from '@/lib/utils/format/formatNames';
import { isGracePeriodExpired, isNameRecordExpired } from '@/lib/utils/names';

import { PanelTileType } from './enums';
import { PanelTile } from './PanelTile';

interface NamePanelTileProps {
    registration: RegistrationNft;
    onClick: () => void;
}
export function NamePanelTile({ registration, onClick }: NamePanelTileProps) {
    const account = useCurrentAccount();
    const { data: addressName } = useGetDefaultName(account?.address || '');
    const { data: names } = useRegistrationNfts('name');

    const nameParts = splitNameParts(registration.name);
    const isSubname = !!nameParts.parentName;

    if (!registration) return null;

    const isExpired = isSubname
        ? isNameRecordExpired(registration)
        : isGracePeriodExpired(registration);

    const isParentInGracePeriod = (() => {
        const parentRegistration = names?.find((n) => n.name === nameParts.parentName);
        return parentRegistration
            ? isNameRecordExpired(parentRegistration) && !isGracePeriodExpired(parentRegistration)
            : false;
    })();

    const isInGracePeriod = isSubname
        ? isParentInGracePeriod
        : isNameRecordExpired(registration) && !isGracePeriodExpired(registration);

    const panelType = isInGracePeriod
        ? PanelTileType.Warning
        : isExpired
          ? PanelTileType.Destructive
          : PanelTileType.Default;

    return (
        <PanelTile
            type={panelType}
            icon={
                addressName === registration.name ? (
                    <StarHex className="w-4 h-4 text-names-primary-80" />
                ) : null
            }
            title={getNameLabel(registration.name, { truncateLongSubnames: true })}
            onClick={onClick}
            footer={
                <PanelFooter
                    isExpired={isExpired}
                    isInGracePeriod={isInGracePeriod}
                    expirationTimestampMs={registration.expirationTimestampMs}
                />
            }
        />
    );
}

interface PanelFooterProps {
    isExpired: boolean;
    isInGracePeriod: boolean;
    expirationTimestampMs: number;
}

function PanelFooter({ isExpired, isInGracePeriod, expirationTimestampMs }: PanelFooterProps) {
    const expirationDate = formatExpirationDate(new Date(expirationTimestampMs));

    const Icon = isInGracePeriod ? Info : isExpired ? Warning : null;
    const expirationLabel = isInGracePeriod
        ? `Expires • ${expirationDate}`
        : isExpired
          ? `Expired • ${expirationDate}`
          : '';

    return isExpired || isInGracePeriod ? (
        <div className="flex flex-row w-full gap-x-xs text-body-md justify-between px-sm py-xs">
            <div
                className={clsx('flex flex-row items-center gap-x-xs', {
                    'text-names-warning-90': isInGracePeriod,
                    'text-names-error-90': isExpired,
                })}
            >
                {Icon && <Icon className="w-4 h-4" />}
                <p>{expirationLabel}</p>
            </div>
            <ButtonUnstyled
                className="px-xs leading-5 rounded-md hover:opacity-80 transition-opacity"
                onClick={() => {}}
            >
                Renew→
            </ButtonUnstyled>
        </div>
    ) : null;
}
