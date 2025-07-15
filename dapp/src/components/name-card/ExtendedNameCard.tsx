// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Add,
    Assets,
    Calendar,
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
import { getNameLabel } from '@/lib/utils/format/formatNames';

import { DeleteNameDialog, UpdateNameDialog } from '../dialogs';
import { CreateSubnameDialog } from '../dialogs/CreateSubnameDialog';
import { PersonalizeAvatarDialog } from '../dialogs/PersonalizeAvatarDialog';
import { RenewNameDialog } from '../dialogs/RenewNameDialog';
import { DropdownMenuOption } from '../DropdownMenuOptions';
import { NameCard } from './NameCard';
import { NameCardBody } from './NameCardBody';
import { SubnameCountIndicator } from './NameCardIndicators';

interface ExtendedNameCardProps {
    nft: RegistrationNft;
    onSubnameListClick: () => void;
    badge?: React.ReactNode;
}

export function ExtendedNameCard({ nft, onSubnameListClick, badge }: ExtendedNameCardProps) {
    const [isUpdateNameDialogOpen, setIsUpdateNameDialogOpen] = useState<boolean>(false);
    const [isDeleteNameDialogOpen, setIsDeleteNameDialogOpen] = useState<boolean>(false);
    const [isCreateSubnameDialogOpen, setIsCreateSubnameDialogOpen] = useState<boolean>(false);
    const [isPersonalizeAvatarNameOpen, setIsPersonalizeAvatarNameOpen] = useState<boolean>(false);
    const [isRenewSubnameDialogOpen, setIsRenewSubnameDialogOpen] = useState<boolean>(false);

    const nameTree = useNameTree(nft.name);

    const label = getNameLabel(nft.name);

    const menuOptions: MenuListItem[] = [
        {
            onClick: () => setIsUpdateNameDialogOpen(true),
            children: <DropdownMenuOption icon={<Settings />} label="Manage" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Pined />} label="Make name default" />,
        //     hideBottomBorder: true,
        // },
        {
            onClick: () => setIsDeleteNameDialogOpen(true),
            children: <DropdownMenuOption icon={<Warning />} label="Delete" />,
            isHidden: !(nft.isExpired && nameTree ? nameTree.subnames.length > 0 : false),
            hideBottomBorder: true,
        },
        {
            onClick: () => setIsPersonalizeAvatarNameOpen(true),
            children: <DropdownMenuOption icon={<Assets />} label="Personalize Avatar" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Delete />} label="Remove Avatar" />,
        //     isDisabled: true,
        // },
        {
            onClick: () => setIsCreateSubnameDialogOpen(true),
            children: <DropdownMenuOption icon={<Add />} label="Create Subname" />,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Link />} label="Link to Wallet Address" />,
        // },
        {
            onClick: () => setIsRenewSubnameDialogOpen(true),
            children: <DropdownMenuOption icon={<Calendar />} label="Renew Name" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Info />} label="View All Info" />,
        //     hideBottomBorder: true,
        // },
    ];

    return (
        <>
            <NameCard name={nft.name} badge={badge} menuOptions={menuOptions}>
                <NameCardBody name={label}>
                    <SubnameCountIndicator
                        onSubnameListClick={onSubnameListClick}
                        subnameCount={nameTree?.subnames?.length ?? 0}
                        onAddSubnameClick={() => setIsCreateSubnameDialogOpen(true)}
                    />

                    <Button text="Placeholder" type={ButtonType.Secondary} onClick={() => {}} />
                </NameCardBody>
            </NameCard>

            {isUpdateNameDialogOpen ? (
                <UpdateNameDialog
                    open
                    name={nft.name}
                    setOpen={() => setIsUpdateNameDialogOpen(false)}
                />
            ) : null}

            {isDeleteNameDialogOpen ? (
                <DeleteNameDialog open nft={nft} setOpen={() => setIsDeleteNameDialogOpen(false)} />
            ) : null}

            {isCreateSubnameDialogOpen ? (
                <CreateSubnameDialog
                    name={nft.name}
                    setOpen={() => setIsCreateSubnameDialogOpen(false)}
                />
            ) : null}

            {isPersonalizeAvatarNameOpen ? (
                <PersonalizeAvatarDialog
                    name={nft.name}
                    setOpen={() => setIsPersonalizeAvatarNameOpen(false)}
                />
            ) : null}

            {isRenewSubnameDialogOpen ? (
                <RenewNameDialog
                    name={nft.name}
                    setOpen={() => setIsRenewSubnameDialogOpen(false)}
                />
            ) : null}
        </>
    );
}
