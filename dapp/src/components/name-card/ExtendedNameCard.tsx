// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, ButtonType } from '@iota/apps-ui-kit';

import { useNameManageDialog } from '@/hooks/useNameMenuOptions';
import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { formatNameLabel } from '@/lib/utils/format/formatNames';
import { getNameMenuOptions } from '@/lib/utils/getNameMenuOptions';

import { NameDialogId } from '../dialogs/enums';
import { NameDialogsController } from '../dialogs/NameDialogsController';
import { NameCard } from './NameCard';
import { NameCardBody } from './NameCardBody';
import { SubnameCountIndicator } from './NameCardIndicators';

interface ExtendedNameCardProps {
    nft: RegistrationNft;
    onSubnameListClick: () => void;
    badge?: React.ReactNode;
    isActive?: boolean;
}

export function ExtendedNameCard({
    nft,
    onSubnameListClick,
    badge,
    isActive,
}: ExtendedNameCardProps) {
    const nameTree = useNameTree(nft.name);

    const { openDialogId, openDialog, closeDialog } = useNameManageDialog();

    const hasSubnames = nameTree ? nameTree?.subnames.length > 0 : false;
    const menuOptions = getNameMenuOptions(nft, hasSubnames, openDialog);
    const label = formatNameLabel(nft.name);

    return (
        <>
            <NameCard name={nft.name} badge={badge} menuOptions={menuOptions} isSelected={isActive}>
                <NameCardBody name={label}>
                    <SubnameCountIndicator
                        onSubnameListClick={onSubnameListClick}
                        subnameCount={nameTree?.subnames?.length ?? 0}
                        onAddSubnameClick={() => openDialog(NameDialogId.CreateSubname)}
                    />

                    <Button text="Placeholder" type={ButtonType.Secondary} onClick={() => {}} />
                </NameCardBody>
            </NameCard>

            <NameDialogsController nft={nft} openDialogId={openDialogId} onClose={closeDialog} />
        </>
    );
}
