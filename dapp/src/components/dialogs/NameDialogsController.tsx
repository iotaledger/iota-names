// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Fragment } from 'react';

import { RegistrationNft } from '@/lib/interfaces';

import { DeleteNameDialog } from '.';
import { ConnectToAddressDialog } from './ConnectToAddressDialog';
import { CreateSubnameDialog } from './CreateSubnameDialog';
import { NameDialogId } from './enums';
import { GeneralInfoDialog } from './GeneralInfoDialog';
import { PersonalizeAvatarDialog } from './PersonalizeAvatarDialog';
import { RenewNameDialog } from './RenewNameDialog';
import { SetPermissionsDialog } from './SetPermissionsDialog';

interface NameDialogsControllerProps {
    nft: RegistrationNft;
    openDialogId: NameDialogId | null;
    onClose: () => void;
}

export function NameDialogsController({ nft, openDialogId, onClose }: NameDialogsControllerProps) {
    return (
        <Fragment>
            {openDialogId === NameDialogId.Delete ? (
                <DeleteNameDialog nft={nft} setOpen={onClose} />
            ) : null}

            {openDialogId === NameDialogId.SetPermissions ? (
                <SetPermissionsDialog name={nft.name} setOpen={onClose} />
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
            {openDialogId === NameDialogId.ConnectToAddress ? (
                <ConnectToAddressDialog name={nft.name} setOpen={onClose} />
            ) : null}
        </Fragment>
    );
}
