// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Add,
    Assets,
    Calendar,
    Info,
    // Add,
    // Assets,
    // Calendar,
    // Delete,
    // Info,
    // Link,
    // Pined,
    Settings,
    Warning,
} from '@iota/apps-ui-icons';
import { Button, ButtonType } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { MenuListItem } from '@/lib/types/components';
import { formatNameLabel } from '@/lib/utils/format/formatNames';

import { DeleteNameDialog, UpdateNameDialog } from '../dialogs';
import { CreateSubnameDialog } from '../dialogs/CreateSubnameDialog';
import { GeneralInfoDialog } from '../dialogs/GeneralInfoDialog';
import { PersonalizeAvatarDialog } from '../dialogs/PersonalizeAvatarDialog';
import { RenewNameDialog } from '../dialogs/RenewNameDialog';
import { DropdownMenuOption } from '../DropdownMenuOptions';
import { NameCard } from './NameCard';
import { NameCardBody } from './NameCardBody';
import { SubnameCountIndicator } from './NameCardIndicators';

enum NameDialogId {
    Update = 'update',
    Delete = 'delete',
    CreateSubname = 'create-subname',
    PersonalizeAvatar = 'personalize-avatar',
    Renew = 'renew',
    GeneralInfo = 'general-info',
    SetPermissions = 'set-permissions',
}

interface ExtendedNameCardProps {
    nft: RegistrationNft;
    onSubnameListClick: () => void;
    badge?: React.ReactNode;
}

export function ExtendedNameCard({ nft, onSubnameListClick, badge }: ExtendedNameCardProps) {
    const [openDialogId, setOpenDialogId] = useState<NameDialogId | null>(null);

    const nameTree = useNameTree(nft.name);

    const label = formatNameLabel(nft.name);

    const menuOptions: MenuListItem[] = [
        {
            onClick: () => setOpenDialogId(NameDialogId.Update),
            children: <DropdownMenuOption icon={<Settings />} label="Manage" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Pined />} label="Make name default" />,
        //     hideBottomBorder: true,
        // },
        {
            onClick: () => setOpenDialogId(NameDialogId.Delete),
            children: <DropdownMenuOption icon={<Warning />} label="Delete" />,
            isHidden: !(nft.isExpired && nameTree ? nameTree.subnames.length > 0 : false),
            hideBottomBorder: true,
        },
        {
            onClick: () => setOpenDialogId(NameDialogId.PersonalizeAvatar),
            children: <DropdownMenuOption icon={<Assets />} label="Personalize Avatar" />,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Delete />} label="Remove Avatar" />,
        //     isDisabled: true,
        // },
        {
            onClick: () => setOpenDialogId(NameDialogId.SetPermissions),
            children: <DropdownMenuOption icon={<Settings />} label="Set Permissions" />,
            isHidden: !nft.isSubname,
        },
        {
            onClick: () => setOpenDialogId(NameDialogId.CreateSubname),
            children: <DropdownMenuOption icon={<Add />} label="Create Subname" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Link />} label="Link to Wallet Address" />,
        // },
        {
            onClick: () => setOpenDialogId(NameDialogId.Renew),
            children: <DropdownMenuOption icon={<Calendar />} label="Renew Name" />,
            hideBottomBorder: true,
        },
        {
            onClick: () => setOpenDialogId(NameDialogId.GeneralInfo),
            children: <DropdownMenuOption icon={<Info />} label="View All Info" />,
            hideBottomBorder: true,
        },
    ];

    function closeDialog() {
        setOpenDialogId(null);
    }

    return (
        <>
            <NameCard name={nft.name} badge={badge} menuOptions={menuOptions}>
                <NameCardBody name={label}>
                    <SubnameCountIndicator
                        onSubnameListClick={onSubnameListClick}
                        subnameCount={nameTree?.subnames?.length ?? 0}
                        onAddSubnameClick={() => setOpenDialogId(NameDialogId.CreateSubname)}
                    />

                    <Button text="Placeholder" type={ButtonType.Secondary} onClick={() => {}} />
                </NameCardBody>
            </NameCard>

            {openDialogId === NameDialogId.Update ? (
                <UpdateNameDialog open name={nft.name} setOpen={closeDialog} />
            ) : null}

            {openDialogId === NameDialogId.Delete ? (
                <DeleteNameDialog open nft={nft} setOpen={closeDialog} />
            ) : null}

            {openDialogId === NameDialogId.CreateSubname ? (
                <CreateSubnameDialog name={nft.name} setOpen={closeDialog} />
            ) : null}

            {openDialogId === NameDialogId.SetPermissions ? (
                <UpdateNameDialog open name={nft.name} setOpen={closeDialog} />
            ) : null}

            {openDialogId === NameDialogId.PersonalizeAvatar ? (
                <PersonalizeAvatarDialog name={nft.name} setOpen={closeDialog} />
            ) : null}

            {openDialogId === NameDialogId.Renew ? (
                <RenewNameDialog name={nft.name} setOpen={closeDialog} />
            ) : null}

            {openDialogId === NameDialogId.GeneralInfo ? (
                <GeneralInfoDialog name={nft.name} setOpen={closeDialog} />
            ) : null}
        </>
    );
}
