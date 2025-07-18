// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add, Assets, Calendar, Info, Link, Settings, Warning } from '@iota/apps-ui-icons';
import { isSubname } from '@iota/iota-names-sdk';

import { NameDialogId } from '@/components/dialogs/enums';
import { DropdownMenuOption } from '@/components/DropdownMenuOptions';
import { NameRecordData, useNameRecord } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces';
import { MenuListItem } from '@/lib/types/components';

import { getNamePermissions } from './names';

export function getNameMenuOptions(
    nft: RegistrationNft,
    hasSubnames: boolean,
    onOpen: (dialogId: NameDialogId) => void,
): MenuListItem[] {
    const { data: nameRecordData } = useNameRecord(nft.name);
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const isNameSubname = isSubname(nft.name);
    const namePermissions =
        isNameSubname && nameRecord
            ? getNamePermissions(nameRecord.nameRecord)
            : { allowChildCreation: true, allowTimeExtension: true };
    return [
        {
            onClick: () => onOpen(NameDialogId.ConnectToAddress),
            children: <DropdownMenuOption icon={<Link />} label="Connect to Address" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Pined />} label="Make name default" />,
        //     hideBottomBorder: true,
        // },
        {
            onClick: () => onOpen(NameDialogId.Delete),
            children: <DropdownMenuOption icon={<Warning />} label="Delete" />,
            isHidden: !nft.isExpired || hasSubnames,
            hideBottomBorder: true,
        },
        {
            onClick: () => onOpen(NameDialogId.PersonalizeAvatar),
            children: <DropdownMenuOption icon={<Assets />} label="Personalize Avatar" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Delete />} label="Remove Avatar" />,
        //     isDisabled: true,
        // },
        {
            onClick: () => onOpen(NameDialogId.SetPermissions),
            children: <DropdownMenuOption icon={<Settings />} label="Set Permissions" />,
            isHidden: !nft.isSubname,
        },
        {
            onClick: () => onOpen(NameDialogId.CreateSubname),
            children: <DropdownMenuOption icon={<Add />} label="Create Subname" />,
            isDisabled: !namePermissions.allowChildCreation,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Link />} label="Link to Wallet Address" />,
        // },
        {
            onClick: () => onOpen(NameDialogId.RenewName),
            children: <DropdownMenuOption icon={<Calendar />} label="Renew Name" />,
            isDisabled: !namePermissions.allowTimeExtension,
            hideBottomBorder: true,
        },
        {
            onClick: () => onOpen(NameDialogId.GeneralInfo),
            children: <DropdownMenuOption icon={<Info />} label="View All Info" />,
            hideBottomBorder: true,
        },
    ];
}
