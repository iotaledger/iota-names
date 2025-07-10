// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Settings, Warning } from '@iota/apps-ui-icons';
import { Button, ButtonType } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { getNameLabel } from '@/lib/utils/format/formatNames';

import { DeleteNameDialog, UpdateNameDialog } from '../dialogs';
import { CreateSubnameDialog } from '../dialogs/CreateSubnameDialog';
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
    const [isAddSubnameDialogOpen, setIsAddSubnameDialogOpen] = useState<boolean>(false);

    const nameTree = useNameTree(nft.name);

    const label = getNameLabel(nft.name);

    return (
        <>
            <NameCard
                name={nft.name}
                badge={badge}
                menuOptions={[
                    {
                        onClick: () => setIsUpdateNameDialogOpen(true),
                        children: (
                            <div className="flex flex-row gap-xxs items-center justify-center">
                                <Settings /> Manage
                            </div>
                        ),
                        hideBottomBorder: true,
                    },
                    {
                        onClick: () => setIsDeleteNameDialogOpen(true),
                        children: (
                            <div className="flex flex-row gap-xxs items-center justify-center">
                                <Warning /> Delete
                            </div>
                        ),
                        isHidden:
                            !nft.isExpired || (nameTree ? nameTree.subnames.length > 0 : false),
                        hideBottomBorder: true,
                    },
                ]}
            >
                <NameCardBody name={label}>
                    <SubnameCountIndicator
                        onSubnameListClick={onSubnameListClick}
                        subnameCount={nameTree?.subnames?.length ?? 0}
                        onAddSubnameClick={() => setIsAddSubnameDialogOpen(true)}
                    />

                    <Button text="Placeholder" type={ButtonType.Secondary} onClick={() => {}} />
                </NameCardBody>
            </NameCard>

            {isAddSubnameDialogOpen ? (
                <CreateSubnameDialog
                    open={isAddSubnameDialogOpen}
                    name={nft.name}
                    setOpen={() => setIsAddSubnameDialogOpen(false)}
                />
            ) : null}

            {isUpdateNameDialogOpen ? (
                <UpdateNameDialog
                    open={isUpdateNameDialogOpen}
                    name={nft.name}
                    setOpen={() => setIsUpdateNameDialogOpen(false)}
                />
            ) : null}

            {isDeleteNameDialogOpen ? (
                <DeleteNameDialog
                    open={isDeleteNameDialogOpen}
                    nft={nft}
                    setOpen={() => setIsDeleteNameDialogOpen(false)}
                />
            ) : null}
        </>
    );
}
