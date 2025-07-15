// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add, Assets, Calendar, Settings, Warning } from '@iota/apps-ui-icons';

import { NameDialogId } from '@/components/dialogs/enums';
import { DropdownMenuOption } from '@/components/DropdownMenuOptions';
import { RegistrationNft } from '@/lib/interfaces';
import { MenuListItem } from '@/lib/types/components';

export function getNameMenuOptions(
    nft: RegistrationNft,
    hasSubnames: boolean,
    onOpen: (dialogId: NameDialogId) => void,
): MenuListItem[] {
    return [
        {
            onClick: () => onOpen(NameDialogId.Update),
            children: <DropdownMenuOption icon={<Settings />} label="Manage" />,
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
            isHidden: nft.isExpired && !hasSubnames,
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
            onClick: () => onOpen(NameDialogId.CreateSubname),
            children: <DropdownMenuOption icon={<Add />} label="Create Subname" />,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Link />} label="Link to Wallet Address" />,
        // },
        {
            onClick: () => onOpen(NameDialogId.RenewName),
            children: <DropdownMenuOption icon={<Calendar />} label="Renew Name" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Info />} label="View All Info" />,
        //     hideBottomBorder: true,
        // },
    ];
}
