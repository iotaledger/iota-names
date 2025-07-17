// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Fragment } from 'react';

import { RegistrationNft } from '@/lib/interfaces';

import { DeleteNameDialog, UpdateNameDialog } from '.';
import { CreateSubnameDialog } from './CreateSubnameDialog';
import { NameDialogId } from './enums';
import { GeneralInfoDialog } from './GeneralInfoDialog';
import { PersonalizeAvatarDialog } from './PersonalizeAvatarDialog';
import { RenewNameDialog } from './RenewNameDialog';

interface NameManageDialogsProps {
    nft: RegistrationNft;
    openDialogId: NameDialogId | null;
    onClose: () => void;
}

export function NameManageDialogs({ nft, openDialogId, onClose }: NameManageDialogsProps) {
    return (
        <Fragment>
            {openDialogId === NameDialogId.Update ? (
                <UpdateNameDialog name={nft.name} setOpen={onClose} />
            ) : null}

            {openDialogId === NameDialogId.Delete ? (
                <DeleteNameDialog nft={nft} setOpen={onClose} />
            ) : null}

            {openDialogId === NameDialogId.CreateSubname ? (
                <CreateSubnameDialog name={nft.name} setOpen={onClose} />
            ) : null}

            {openDialogId === NameDialogId.PersonalizeAvatar ? (
                <PersonalizeAvatarDialog name={nft.name} setOpen={onClose} />
            ) : null}

            {openDialogId === NameDialogId.RenewName ? (
                <RenewNameDialog name={nft.name} setOpen={onClose} />
            ) : null}

            {openDialogId === NameDialogId.GeneralInfo ? (
                <GeneralInfoDialog name={nft.name} setOpen={onClose} />
            ) : null}
        </Fragment>
    );
}
