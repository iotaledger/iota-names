// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Info, StarHex, Warning } from '@iota/apps-ui-icons';
import { ButtonUnstyled, truncate } from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import clsx from 'clsx';
import { Fragment } from 'react';

import { MenuButton } from '@/components/buttons/MenuButton';
import { ContextMenuDropdown } from '@/components/ContextMenu';
import { NameDialogsController } from '@/components/dialogs/NameDialogsController';
import { useNameRecord } from '@/hooks';
import { useGetDefaultName } from '@/hooks/useGetDefaultName';
import { useNameContextMenu } from '@/hooks/useNameContextMenu';
import { useNameManageDialog } from '@/hooks/useNameMenuOptions';
import type { RegistrationNft } from '@/lib/interfaces/registration.interfaces';
import { formatExpirationDate } from '@/lib/utils/format/formatExpirationDate';
import { getNameMenuOptions } from '@/lib/utils/getNameMenuOptions';
import { isNameRecordCloseToExpiration, isNameRecordExpired } from '@/lib/utils/names';

import { PanelTileType } from './enums';
import { PanelTile } from './PanelTile';

interface NamePanelTileProps {
    registration: RegistrationNft;
    hasSubnames: boolean;
    onClick: () => void;
    onRenewClick?: () => void;
}
export function NamePanelTile({
    registration,
    hasSubnames,
    onClick,
    onRenewClick,
}: NamePanelTileProps) {
    const { isVisible, position, toggleMenu, closeMenu, dropdownRef, triggerRef } =
        useNameContextMenu();
    const { openDialogId, openDialog, closeDialog } = useNameManageDialog();

    const account = useCurrentAccount();
    const { data: defaultName } = useGetDefaultName(account?.address ?? '');
    const { data: nameRecord } = useNameRecord(registration.name);

    const linkedAddress =
        nameRecord?.type === 'unavailable' ? nameRecord?.nameRecord.targetAddress : undefined;

    const isDefaultName = defaultName === registration.name;
    const isCloseToExpiration = isNameRecordCloseToExpiration(registration);
    const isExpired = isNameRecordExpired(registration);

    const menuOptions = getNameMenuOptions(registration, hasSubnames, openDialog);

    const panelType = (() => {
        if (isCloseToExpiration) return PanelTileType.Warning;
        if (isExpired) return PanelTileType.Destructive;
        return PanelTileType.Default;
    })();

    const expirationDate = formatExpirationDate(new Date(registration.expirationTimestampMs));
    const panelTitle = normalizeIotaName(registration.name, 'at', { truncateLongParts: true });

    return (
        <>
            <PanelTile
                type={panelType}
                icon={isDefaultName ? <StarHex className="w-4 h-4 text-names-primary-80" /> : null}
                title={panelTitle}
                subtitle={linkedAddress ? truncate(linkedAddress, 4, 4) : undefined}
                onClick={onClick}
                menuButton={<MenuButton variant="ghost" onClick={toggleMenu} ref={triggerRef} />}
                footer={
                    isCloseToExpiration || isExpired ? (
                        <PanelFooter
                            isCloseToExpiration={isCloseToExpiration}
                            isExpired={isExpired}
                            expirationDate={expirationDate}
                            onRenewClick={onRenewClick}
                        />
                    ) : null
                }
            />

            <ContextMenuDropdown
                visible={isVisible}
                position={position}
                options={menuOptions}
                dropdownRef={dropdownRef}
                closeMenu={closeMenu}
            />

            <NameDialogsController
                nft={registration}
                openDialogId={openDialogId}
                onClose={closeDialog}
            />
        </>
    );
}

interface PanelFooterProps {
    isCloseToExpiration: boolean;
    isExpired: boolean;
    expirationDate: string;
    onRenewClick?: () => void;
}
function PanelFooter({
    isCloseToExpiration,
    isExpired,
    expirationDate,
    onRenewClick,
}: PanelFooterProps) {
    const Icon = isCloseToExpiration ? Info : isExpired ? Warning : Fragment;
    return (
        <div className="flex flex-row w-full gap-x-xs text-body-md justify-between px-sm py-xs">
            <p
                className={clsx(
                    'flex flex-row items-center gap-x-xs [&>svg]:w-4 [&>svg]:h-4',
                    isCloseToExpiration && 'text-names-warning-90',
                    isExpired && 'text-names-error-90',
                )}
            >
                <Icon />
                {isCloseToExpiration ? 'Expires' : 'Expired'} {'\u2022'} {expirationDate}
            </p>

            <ButtonUnstyled
                className="px-xs leading-5 rounded-md hover:opacity-80 transition-opacity"
                onClick={onRenewClick}
            >
                Renew &rarr;
            </ButtonUnstyled>
        </div>
    );
}
