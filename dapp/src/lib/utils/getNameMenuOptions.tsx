// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    Add,
    Assets,
    Calendar,
    Edit,
    Info,
    Link as LinkSvg,
    Settings,
    Trade,
    Warning,
} from '@iota/apps-ui-icons';
import { isSubname } from '@iota/iota-names-sdk';
import Link from 'next/link';

import { NameDialogId } from '@/components/dialogs/enums';
import { DropdownMenuOption } from '@/components/DropdownMenuOptions';
import { NameRecordData } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces';
import { MenuListItem } from '@/lib/types/components';

import { getNamePermissions } from './names';

export function getNameMenuOptions(
    nft: RegistrationNft,
    hasSubnames: boolean,
    onOpen: (dialogId: NameDialogId) => void,
    record?: NameRecordData,
    isPaymentAuthorized?: boolean,
): MenuListItem[] {
    const nameRecord = record as Extract<NameRecordData, { type: 'unavailable' }> | undefined;
    const isNameSubname = isSubname(nft.name);
    const isNameGracePeriodExpired = !nft.isRenewable;
    const namePermissions =
        isNameSubname && nameRecord
            ? getNamePermissions(nameRecord.nameRecord)
            : { allowChildCreation: true, allowTimeExtension: true };

    return [
        {
            onClick: () => onOpen(NameDialogId.ConnectToAddress),
            children: <DropdownMenuOption icon={<LinkSvg />} label="Connect to Address" />,
            isHidden: nft.isExpired,
            hideBottomBorder: true,
        },
        {
            onClick: () => onOpen(NameDialogId.Delete),
            children: <DropdownMenuOption icon={<Warning />} label="Delete" />,
            isHidden: !nft.isExpired || hasSubnames,
            hideBottomBorder: true,
        },
        {
            onClick: () => onOpen(NameDialogId.PersonalizeAvatar),
            children: <DropdownMenuOption icon={<Assets />} label="Personalize Avatar" />,
            isHidden: nft.isExpired,
            hideBottomBorder: nft.isSubname,
        },
        {
            onClick: () => onOpen(NameDialogId.SetPermissions),
            children: <DropdownMenuOption icon={<Settings />} label="Set Permissions" />,
            isHidden: !nft.isSubname || nft.isExpired,
            hideBottomBorder: !namePermissions.allowChildCreation,
        },
        {
            onClick: () => onOpen(NameDialogId.CreateSubname),
            children: <DropdownMenuOption icon={<Add />} label="Create Subname" />,
            isHidden: !namePermissions.allowChildCreation || nft.isExpired,
            isDisabled: !namePermissions.allowChildCreation,
        },
        {
            isHidden: isNameGracePeriodExpired || nft.isSubname,
            children: (
                <Link
                    href="https://docs.iotanames.com/user/tradeport"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <DropdownMenuOption icon={<Trade />} label="How to List Name" />
                </Link>
            ),
        },
        {
            onClick: () => onOpen(NameDialogId.RenewName),
            children: (
                <DropdownMenuOption
                    icon={<Calendar />}
                    label={isNameSubname ? 'Renew Subname' : 'Renew Name'}
                />
            ),
            isHidden:
                !isPaymentAuthorized ||
                !namePermissions.allowTimeExtension ||
                isNameGracePeriodExpired,
            isDisabled: !namePermissions.allowTimeExtension,
            hideBottomBorder: true,
        },
        {
            onClick: () => onOpen(NameDialogId.EditMetadata),
            children: <DropdownMenuOption icon={<Edit />} label="Edit Metadata" />,
            isHidden: true,
            hideBottomBorder: true,
        },
        {
            onClick: () => onOpen(NameDialogId.GeneralInfo),
            children: <DropdownMenuOption icon={<Info />} label="View All Info" />,
            hideBottomBorder: true,
        },
    ];
}
